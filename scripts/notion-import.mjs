// Genera src/data/seed.json dalle liste Karaoke di Notion (esportate il 2026-11-26).
// Uso: npm run seed
//
// Liste -> cantanti/mood nell'app:
//   "Con mamma"  -> insieme
//   "Mie"        -> ester
//   "Solo mamma" -> mamma
//   "Di gruppo"  -> insieme + mood "gruppo"
// Le canzoni presenti in più liste vengono unite (stesso titolo).
// Formato: [titolo, artista, tonalità], copiati tali e quali da Notion.
import { writeFileSync } from 'node:fs';

const conMamma = [
  ["Mezzo rotto", "Alessandra Amoroso, Big Mama", -4],
  ["Oggi sono io", "Alex Britti", 0],
  ["Vai", "Alfa", 0],
  ["El mismo sol", "Alvaro Soler", 0],
  ["Sofia", "Alvaro Soler", 0],
  ["Volar", "Alvaro Soler", 0],
  ["Un bacio all'improvviso", "Ana Mena ft. Rocco Hunt", -2],
  ["Che to dico a fa", "Angelina Mango", -3],
  ["Ci pensiamo domani", "Angelina Mango", -3],
  ["La noia", "Angelina Mango", -3],
  ["Canto d'amore", "Angelina Mango ft Marco Mengoni", -3],
  ["Piazza San Marco", "Annalisa e Marco Mengoni", -4],
  ["Via", "Baglioni", 0],
  ["Quanto tempo", "Biagio Antonacci", 0],
  ["Per un milione", "Boombadash", 0],
  ["Bam bam", "Camila Cabello ft Ed Sheeran", -4],
  ["Malavita", "Comacose", -2],
  ["Shivers", "Ed Sheeran", 0],
  ["Ancora", "Edoardo de Crescenzo", 0],
  ["Vola", "Edoardo de Crescenzo", 0],
  ["Mezzo mondo", "Emma", -3],
  ["Bailando", "Enrique Iglesias", 0],
  ["Chiamo io chiami tu", "Gaia", -2],
  ["Come saprei", "Giorgia", -3],
  ["Dolcissimo amore", "Irene Grandi", 0],
  ["L'ombelico del mondo", "Jovanotti", 0],
  ["Poesie clandestine", "LDA e Aka7even", 0],
  ["In una notte d'estate", "Le Vibrazioni", 0],
  ["Come foglie", "Malika Ayane", -3],
  ["Senza fare sul serio", "Malika Ayane", -3],
  ["La rondine", "Mango", 0],
  ["Mediterraneo", "Mango", 0],
  ["Nella mia città", "Mango", 0],
  ["Oro", "Mango", 0],
  ["Me so ‘mbriacato", "Mannarino", 0],
  ["Due vite", "Marco Mengoni", 0],
  ["Ma stasera", "Marco Mengoni", 0],
  ["Mi fiderò", "Mengoni ft Madame", 0],
  ["Anche un uomo", "Mina", -2],
  ["La notte", "Moda", 0],
  ["Almeno stavolta", "Nek", 0],
  ["Bianca", "Noemi", 0],
  ["Giovani wannabe", "PTN", 0],
  ["Ricordi", "PTN", 0],
  ["Romantico ma muori", "PTN", 0],
  ["Rubami la notte", "PTN", 0],
  ["Scrivile scemo", "PTN", 0],
  ["Sorry scusa lo siento", "PTN", 0],
  ["Non litighiamo più", "Rocco Hunt", 0],
  ["Oh ma", "Rocco Hunt e Noemi", 0],
  ["Come un tuono", "Rose Villain", -4],
  ["Ossesione", "Samurai jay", 1],
  ["Anema e core", "Serena Brancale", -3],
  ["Serenata", "Serena Brancale ft Alessandra Amoroso", -2],
  ["Al mio paese", "Serena Brancale ft Delia ft Levante", -3],
  ["Tutto quello che un uomo", "Sergio Cammariere", 4],
  ["Vertebre", "Settembre", 0],
  ["Cuore e vento", "Tazenda", 0],
  ["Pronto come va", "The kolors", -1],
  ["Tu con chi fai l'amore", "The kolors", -2],
  ["Partenope", "The kolors ft Serena Brancale", -3],
  ["Non me lo so spiegare", "Tiziano Ferro", 0],
  ["Rosso relativo", "Tiziano Ferro", 0],
  ["Sere nere", "Tiziano Ferro", 0],
  ["Nei tuoi particolari", "Ultimo", 0],
];

const mie = [
  ["Chasing pavements", "Adele", -4],
  ["Hello", "Adele", -4],
  ["Rolling in the deep", "Adele", -6],
  ["Someone like you", "Adele", -2],
  ["I don't want to miss a thing", "Aerosmith", -2],
  ["Eye in the sky", "Alan Parsons Project", 0],
  ["La distanza di un amore", "Alex Baroni", 0],
  ["Pavimento liquido", "Alex Baroni", 0],
  ["Scrivi qualcosa per me", "Alex Baroni", 0],
  ["Back to black", "Amy Winehouse", 0],
  ["Beautiful things", "Benson Boone", -4],
  ["Just the two of us", "Bill Withers", 0],
  ["Baby one more time", "Britney Spears", -2],
  ["Oops I did it again", "Britney Spears", -2],
  ["Higher", "Creed", 0],
  ["My sacrifice", "Creed", -2],
  ["One last breath", "Creed", 0],
  ["Monetine", "Daniele Silvestri", -2],
  ["Home", "Daughtry", -3],
  ["Long live rock and roll", "Daughtry", 0],
  ["Titanium", "David Guetta ft. Sia", -6],
  ["Tenerife sea", "Ed Sheeran", 0],
  ["Best of you", "Foo Fighters", -4],
  ["Everlong", "Foo fighters", 0],
  ["Holiday", "Green day", 0],
  ["Demons", "Imagine Dragons", 0],
  ["You will never know", "Imany", 0],
  ["Drive", "Incubus", -1],
  ["I love rock and roll", "Joan Jett", 0],
  ["Eco", "Joan Thiele", -2],
  ["All of me", "John Legend", 0],
  ["Use somebody", "Kings of Leon", -4],
  ["7 years", "Lukas Graham", 0],
  ["Nel bene e nel male", "Madame", 0],
  ["Feeling good", "Muse", 0],
  ["Time is running out", "Muse", 0],
  ["How you remind me", "Nickelback", 0],
  ["Love me or leave me", "Nina Simone", 0],
  ["Don't know why", "Norah Jones", 0],
  ["Sunrise", "Norah Jones", -2],
  ["Wonderwall", "Oasis", 0],
  ["So easy (to fall in love)", "Olivia Dean", -4],
  ["Crazy little thing called love", "Queen", 1],
  ["Californication", "Red Hot Chilli Peppers", 0],
  ["Otherside", "Red Hot Chilli Peppers", 0],
  ["Zombie", "The cranberries", -1],
  ["My immortal", "The Evanescence", -4],
  ["Seven nation army", "The white stripes", 0],
  ["Angels on the moon", "Thriving Ivory", 0],
  ["Fallen", "Volbeat", -2],
];

const soloMamma = [
  ["Come saprei", "Giorgia", -3],
  ["Come foglie", "Malika Ayanne", -3],
  ["La rondine", "Mango", 0],
  ["Oro", "Mango", 0],
  ["Vent'anni", "Massimo Ranieri", 0],
  ["Resta cu me", "Pino Daniele", 0],
];

const diGruppo = [
  ["Yanez de gomera", "", 0],
  ["Splash", "Colapasce e Di Martino", 0],
  ["Musica leggerissima", "Colapesce e Di Martino", 0],
  ["Dove si balla", "D'Argen d'amico", 0],
  ["Salirò", "Daniele Silvestri", 0],
  ["Urlando contro il cielo", "Ligabue", 0],
  ["Fotoromanza", "Nannini", 0],
  ["Io e la mia signorina", "Neffa", 0],
  ["Ricominciamo", "Pappalardo", 0],
  ["Mi vendo", "Renato Zero", 0],
  ["Gianna Gianna", "Rino Gaetano", 0],
  ["Made in Italy", "Rosa Chemical", 0],
  ["Italodisco", "The kolors", 0],
  ["Tu con chi fai l'amore", "The kolors", -2],
  ["Sole spento", "Timoria", 0],
  ["Baila Morena", "Zucchero", 0],
  ["Funky Gallo", "Zucchero", 0],
];

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const songs = new Map();
const add = (list, singer, mood) => {
  for (const [title, artist, key] of list) {
    const id = slug(title);
    const s = songs.get(id) ?? { id, title, artist, key, singers: [], moods: [], lastSung: null, score: 0 };
    if (!s.singers.includes(singer)) s.singers.push(singer);
    if (mood && !s.moods.includes(mood)) s.moods.push(mood);
    songs.set(id, s);
  }
};

add(conMamma, 'insieme');
add(mie, 'ester');
add(soloMamma, 'mamma');
add(diGruppo, 'insieme', 'gruppo');

const out = [...songs.values()].sort((a, b) => a.title.localeCompare(b.title, 'it'));
writeFileSync(new URL('../src/data/seed.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`Scritte ${out.length} canzoni in src/data/seed.json`);
