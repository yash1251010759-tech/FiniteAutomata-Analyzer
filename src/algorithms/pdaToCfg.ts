import { CFGDefinition, PDADefinition, StateNode } from '../types/automata';
import { isEpsilon } from './dfaSimulation';

interface NormalizedTransition {
  from: string;
  to: string;
  input: string;
  pop: string;
  push: string[];
}

export function convertPdaToCfg(pda: PDADefinition): CFGDefinition {
  const stateIds = pda.states.map(state => state.id);
  if (!['FINAL_STATE', 'EMPTY_STACK', 'BOTH'].includes(pda.acceptMode)) {
    throw new Error(`Unknown PDA acceptance mode '${pda.acceptMode}'.`);
  }
  if (!stateIds.includes(pda.startStateId)) throw new Error(`PDA start state '${pda.startStateId}' does not exist.`);
  if (!pda.stackAlphabet.includes(pda.startStackSymbol)) {
    throw new Error(`Start stack symbol '${pda.startStackSymbol}' is not in the stack alphabet.`);
  }
  if (!pda.states.some(state => pda.finalStateIds.includes(state.id)) &&
      pda.acceptMode !== 'EMPTY_STACK') {
    throw new Error('PDA final-state acceptance requires at least one existing final state.');
  }
  for (const transition of pda.transitions) {
    if (!stateIds.includes(transition.from) || !stateIds.includes(transition.to)) {
      throw new Error(`PDA transition references an unknown state (${transition.from} → ${transition.to}).`);
    }
    if (!isEpsilon(transition.popSymbol) && !pda.stackAlphabet.includes(transition.popSymbol)) {
      throw new Error(`Popped stack symbol '${transition.popSymbol}' is not in the stack alphabet.`);
    }
    for (const symbol of transition.pushSymbols.filter(item => !isEpsilon(item))) {
      if (!pda.stackAlphabet.includes(symbol)) throw new Error(`Pushed stack symbol '${symbol}' is not in the stack alphabet.`);
    }
    if (!isEpsilon(transition.inputSymbol) && !pda.inputAlphabet.includes(transition.inputSymbol)) {
      throw new Error(`Input symbol '${transition.inputSymbol}' is not in the PDA input alphabet.`);
    }
  }

  const states: StateNode[] = [...pda.states];
  const finalStateIds = [...pda.finalStateIds];
  let transitions: NormalizedTransition[] = [];
  for (const transition of pda.transitions) {
    const input = isEpsilon(transition.inputSymbol) ? '' : transition.inputSymbol;
    const push = transition.pushSymbols.filter(symbol => !isEpsilon(symbol));
    if (isEpsilon(transition.popSymbol)) {
      for (const stackTop of pda.stackAlphabet) {
        transitions.push({
          from: transition.from,
          to: transition.to,
          input,
          pop: stackTop,
          push: [...push, stackTop],
        });
      }
    } else {
      transitions.push({
        from: transition.from,
        to: transition.to,
        input,
        pop: transition.popSymbol,
        push,
      });
    }
  }

  let targetStates: string[];
  if (pda.acceptMode === 'EMPTY_STACK') {
    targetStates = stateIds;
  } else if (pda.acceptMode === 'BOTH') {
    targetStates = finalStateIds;
  } else {
    const drainId = 'pda-cfg-drain';
    if (stateIds.includes(drainId)) throw new Error(`Reserved conversion state '${drainId}' already exists.`);
    states.push({ id: drainId, label: drainId, x: 0, y: 0 });
    for (const finalId of finalStateIds) {
      for (const stackTop of pda.stackAlphabet) {
        transitions.push({ from: finalId, to: drainId, input: '', pop: stackTop, push: [] });
        transitions.push({ from: drainId, to: drainId, input: '', pop: stackTop, push: [] });
      }
    }
    targetStates = [...new Set([...finalStateIds, drainId])];
  }

  const stackSymbols = [...new Set(pda.stackAlphabet)];
  const allStateIds = states.map(state => state.id);
  const triples: Array<[string, string, string]> = [];
  for (const from of allStateIds) {
    for (const stackSymbol of stackSymbols) {
      for (const to of allStateIds) triples.push([from, stackSymbol, to]);
    }
  }
  if (triples.length + 1 > 26) {
    throw new Error(`This PDA needs ${triples.length + 1} CFG variables; this app's CFG model supports at most 26 single-letter variables.`);
  }

  const variableNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const tripleVariable = new Map<string, string>();
  triples.forEach((triple, index) => tripleVariable.set(JSON.stringify(triple), variableNames[index]));
  const grammarProductions: CFGDefinition['productions'] = [];
  let ruleId = 0;
  const getVariable = (from: string, stackSymbol: string, to: string): string => {
    const result = tripleVariable.get(JSON.stringify([from, stackSymbol, to]));
    if (!result) throw new Error('PDA-to-CFG conversion exceeded the generated variable set.');
    return result;
  };

  const addRulesForTransition = (
    transition: NormalizedTransition,
    target: string,
    intermediate: string[]
  ) => {
    const rightSide = transition.input + transition.push.map((symbol, pushIndex) => {
      const nextState = pushIndex === transition.push.length - 1 ? target : intermediate[pushIndex];
      const previousState = pushIndex === 0 ? transition.to : intermediate[pushIndex - 1];
      return getVariable(previousState, symbol, nextState);
    }).join('');
    grammarProductions.push({
      id: `pda-cfg-${ruleId++}`,
      variable: getVariable(transition.from, transition.pop, target),
      replacement: rightSide || 'ε',
    });
  };

  for (const transition of transitions) {
    const intermediateCount = Math.max(0, transition.push.length - 1);
    let paths: string[][] = [[]];
    for (let i = 0; i < intermediateCount; i++) {
      paths = paths.flatMap(path => allStateIds.map(stateId => [...path, stateId]));
      if (paths.length * triples.length > 50_000) {
        throw new Error('PDA-to-CFG conversion would generate too many productions; simplify the PDA first.');
      }
    }
    for (const target of allStateIds) {
      if (transition.push.length === 0 && target !== transition.to) continue;
      for (const intermediate of paths) {
        addRulesForTransition(transition, target, intermediate);
      }
    }
  }

  const usedVariables = new Set(tripleVariable.values());
  const availableStartVariable = variableNames.find(name => !usedVariables.has(name));
  if (!availableStartVariable) throw new Error('No CFG variable is available for the conversion start symbol.');
  const startVariable = availableStartVariable;
  if (tripleVariable.size + 1 > 26) throw new Error('No CFG variable is available for the conversion start symbol.');
  grammarProductions.push(...targetStates.map((target, index) => ({
    id: `pda-cfg-start-${index}`,
    variable: startVariable,
    replacement: getVariable(pda.startStateId, pda.startStackSymbol, target),
  })));

  const variables = [...new Set([startVariable, ...tripleVariable.values()])];
  return {
    id: `${pda.id}-cfg`,
    name: `${pda.name} (equivalent CFG)`,
    variables,
    terminals: pda.inputAlphabet,
    startVariable,
    productions: grammarProductions,
  };
}
