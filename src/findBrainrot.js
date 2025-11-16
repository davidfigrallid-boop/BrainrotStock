function getBrainrotByKey(brainrotList, name, mutations) {
  // mutations, array ou string
  const muts = Array.isArray(mutations) ? mutations.join(",") : mutations;
  return brainrotList.find(br =>
    br.name === name &&
    br.mutations.join(",") === muts
  );
}
