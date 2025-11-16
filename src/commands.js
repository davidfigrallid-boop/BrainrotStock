function showCompte(brainrotList, userIsAdmin) {
  if (!userIsAdmin) return "Accès refusé";
  return brainrotList.map(br => `${br.displayName()} => Compte: ${br.compte || 'N/A'}`).join("\n");
}
