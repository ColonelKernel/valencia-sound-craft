function mapIndex(index: number, sourceLength: number, targetLength: number) {
  if (sourceLength <= 1 || targetLength <= 1) {
    return 0;
  }

  return Math.min(
    targetLength - 1,
    Math.round((index / (sourceLength - 1)) * (targetLength - 1))
  );
}

export interface CompositeGroove {
  rawPattern: number[];
  midiPattern: number[];
  velocityPattern: number[];
  protectedSteps: number[];
}

export function resamplePatternValues(values: number[], targetLength: number) {
  if (targetLength <= 0) {
    return [];
  }

  if (values.length === targetLength) {
    return [...values];
  }

  const result = new Array(targetLength).fill(0);

  values.forEach((value, index) => {
    if (value <= 0) {
      return;
    }

    const targetIndex = mapIndex(index, values.length, targetLength);
    result[targetIndex] = Math.max(result[targetIndex], value);
  });

  return result;
}
