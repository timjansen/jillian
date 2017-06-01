
// Describes meta-attributes of a sentence such as politeness

class Tone extends JelType {
  constructor(politeRude) {
    super();
    this.politeRude = politeRude; // positive is polite, negative is rude
  }
}

