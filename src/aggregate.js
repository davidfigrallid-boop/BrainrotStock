function addBrainrot(brainrotList, nouveauBrainrot) {
  const index = brainrotList.findIndex(br =>
    br.name === nouveauBrainrot.name &&
    br.crypto === nouveauBrainrot.crypto &&
    br.rarete === nouveauBrainrot.rarete &&
    br.compte === nouveauBrainrot.compte &&
    br.mutations.join(",") === nouveauBrainrot.mutations.join(",")
  );
  if (index > -1) {
    brainrotList[index].valeur += nouveauBrainrot.valeur;
  } else {
    brainrotList.push(nouveauBrainrot);
  }
}