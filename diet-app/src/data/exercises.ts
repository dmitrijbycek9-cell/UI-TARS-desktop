import type { Exercise } from '@/types';

/** Kuratierte Yoga-, Pilates- & Dehnübungen mit Dauer und Beschreibung. */
export const EXERCISES: Exercise[] = [
  {
    id: 'ex-sonnengruss',
    name: 'Sonnengruß',
    category: 'Yoga',
    emoji: '🧘',
    durationSec: 300,
    description:
      'Fließende Abfolge: Berghaltung, Vorbeuge, Planke, Hund und zurück. Atme ruhig mit jeder Bewegung.',
    met: 3.3,
  },
  {
    id: 'ex-krieger',
    name: 'Krieger I & II',
    category: 'Yoga',
    emoji: '🧎',
    durationSec: 240,
    description:
      'Ausfallschritt, Arme nach oben bzw. zur Seite. Stärkt Beine und öffnet die Hüfte. Seiten wechseln.',
    met: 3.0,
  },
  {
    id: 'ex-baum',
    name: 'Baum (Gleichgewicht)',
    category: 'Yoga',
    emoji: '🌳',
    durationSec: 180,
    description:
      'Auf einem Bein stehen, Fußsohle an Innenschenkel, Hände vor der Brust. Blick fixieren, Seite wechseln.',
    met: 2.5,
  },
  {
    id: 'ex-kindhaltung',
    name: 'Kindhaltung (Entspannung)',
    category: 'Yoga',
    emoji: '🧘‍♀️',
    durationSec: 180,
    description:
      'Auf den Fersen sitzen, Oberkörper nach vorne ablegen, Arme lang. Tief in den Rücken atmen.',
    met: 2.0,
  },
  {
    id: 'ex-plank',
    name: 'Unterarmstütz (Plank)',
    category: 'Pilates',
    emoji: '🪵',
    durationSec: 60,
    description:
      'Unterarme und Zehen am Boden, Körper bildet eine gerade Linie. Bauch fest anspannen.',
    met: 4.0,
  },
  {
    id: 'ex-hundred',
    name: 'The Hundred',
    category: 'Pilates',
    emoji: '💯',
    durationSec: 120,
    description:
      'Auf dem Rücken, Beine angehoben, Kopf/Schultern leicht an. Arme neben dem Körper kräftig auf- und abpumpen.',
    met: 3.5,
  },
  {
    id: 'ex-bruecke',
    name: 'Schulterbrücke',
    category: 'Pilates',
    emoji: '🌉',
    durationSec: 120,
    description:
      'Auf dem Rücken, Füße aufgestellt, Becken langsam heben und senken. Po und Rumpf aktivieren.',
    met: 3.2,
  },
  {
    id: 'ex-beinheben',
    name: 'Seitliches Beinheben',
    category: 'Pilates',
    emoji: '🦵',
    durationSec: 120,
    description:
      'In Seitenlage das obere Bein kontrolliert heben und senken. Stärkt Hüfte und Außenschenkel. Seite wechseln.',
    met: 3.0,
  },
  {
    id: 'ex-katze-kuh',
    name: 'Katze-Kuh',
    category: 'Dehnen',
    emoji: '🐱',
    durationSec: 120,
    description:
      'Im Vierfüßlerstand Rücken im Wechsel runden und sanft durchhängen lassen. Mobilisiert die Wirbelsäule.',
    met: 2.3,
  },
  {
    id: 'ex-hueftdehnung',
    name: 'Hüftöffner',
    category: 'Dehnen',
    emoji: '🤸',
    durationSec: 180,
    description:
      'Tiefer Ausfallschritt, hinteres Knie ablegen, Becken nach vorne schieben. Seiten wechseln.',
    met: 2.3,
  },
];

export const EXERCISE_CATEGORIES = [
  ...new Set(EXERCISES.map((e) => e.category)),
];
