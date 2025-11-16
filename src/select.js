function selectBrainrot(brainrotList, name, mutationArray) {
  return brainrotList.filter(br => br.name === name &&
    mutationArray.every(mut => br.mutations.includes(mut)));
}