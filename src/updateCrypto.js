function actualiseCryptoDisplay(brainrotList, cryptoChoisi) {
  // Filtre les brainrots ayant la bonne crypto et refresh l'UI
  const filtree = brainrotList.filter(b => b.crypto === cryptoChoisi);
  // TODO: Ensuite, fait appel au fonctionnement d'affichage brainrot
  renderBrainrotList(filtree);
}