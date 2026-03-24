import { Question, Chapter } from '../types';

export const INITIAL_SUBJECT_NAMES: Record<string, string> = {
  ETG: 'Épreuve Théorique Générale',
  CONDUITE: 'Conduite & Manœuvres',
  REGLEMENTATION: 'Réglementation Transport',
  SECURITE: 'Sécurité Routière',
  LOGISTIQUE: 'Logistique & Organisation',
};

export const INITIAL_CHAPTERS: Chapter[] = [
  // 2ndes CRM
  { level: '2ndes CRM', subject: 'ETG',            title: 'Signalisation routière' },
  { level: '2ndes CRM', subject: 'ETG',            title: 'Priorités et intersections' },
  { level: '2ndes CRM', subject: 'ETG',            title: 'Règles de circulation' },
  { level: '2ndes CRM', subject: 'CONDUITE',       title: 'Les bases de la conduite PL' },
  { level: '2ndes CRM', subject: 'CONDUITE',       title: 'Manœuvres en marche arrière' },
  { level: '2ndes CRM', subject: 'SECURITE',       title: 'Équipements de sécurité' },
  { level: '2ndes CRM', subject: 'SECURITE',       title: 'Premiers secours' },
  // 1ères CRM
  { level: '1ères CRM', subject: 'ETG',            title: 'Code de la route approfondi' },
  { level: '1ères CRM', subject: 'CONDUITE',       title: 'Conduite en conditions difficiles' },
  { level: '1ères CRM', subject: 'CONDUITE',       title: 'Attelage et dételage' },
  { level: '1ères CRM', subject: 'REGLEMENTATION', title: 'Temps de conduite et repos (EU 561/2006)' },
  { level: '1ères CRM', subject: 'REGLEMENTATION', title: 'Documents de transport' },
  { level: '1ères CRM', subject: 'LOGISTIQUE',     title: 'Chargement et arrimage' },
  // Terminales CRM
  { level: 'Terminales CRM', subject: 'ETG',            title: 'Révisions ETG complètes' },
  { level: 'Terminales CRM', subject: 'CONDUITE',       title: 'Plateau C – Vérifications' },
  { level: 'Terminales CRM', subject: 'CONDUITE',       title: 'Plateau CE – Ensemble articulé' },
  { level: 'Terminales CRM', subject: 'REGLEMENTATION', title: 'RSE et chronotachygraphe' },
  { level: 'Terminales CRM', subject: 'REGLEMENTATION', title: 'Transport de matières dangereuses' },
  { level: 'Terminales CRM', subject: 'LOGISTIQUE',     title: 'Organisation du transport' },
  { level: 'Terminales CRM', subject: 'SECURITE',       title: 'Éco-conduite et prévention' },
];

export const ALL_QUESTIONS: Question[] = [
  // 2ndes CRM - ETG - Signalisation routière
  {
    id: 'q1', type: 'qcm', level: '2ndes CRM', subject: 'ETG', chapter: 'Signalisation routière',
    text: 'Que signifie un panneau rond à fond bleu ?',
    options: ['Une interdiction', 'Une obligation', 'Un danger', 'Une indication'],
    correct: 1,
    explanation: 'Un panneau rond à fond bleu indique une obligation (ex : direction obligatoire, vitesse minimale).'
  },
  {
    id: 'q2', type: 'qcm', level: '2ndes CRM', subject: 'ETG', chapter: 'Signalisation routière',
    text: 'Quelle est la forme d\'un panneau de danger ?',
    options: ['Carré', 'Rond', 'Triangulaire', 'Octogonal'],
    correct: 2,
    explanation: 'Les panneaux de danger sont de forme triangulaire avec un bord rouge.'
  },
  {
    id: 'q3', type: 'qcm', level: '2ndes CRM', subject: 'ETG', chapter: 'Priorités et intersections',
    text: 'À une intersection sans signalisation, qui est prioritaire ?',
    options: ['Le véhicule venant de gauche', 'Le véhicule venant de droite', 'Le premier arrivé', 'Le poids lourd'],
    correct: 1,
    explanation: 'La règle de la priorité à droite s\'applique : le véhicule venant de droite est prioritaire.'
  },
  {
    id: 'q4', type: 'qcm', level: '2ndes CRM', subject: 'ETG', chapter: 'Règles de circulation',
    text: 'Quelle est la vitesse maximale d\'un poids lourd sur autoroute en France ?',
    options: ['110 km/h', '90 km/h', '130 km/h', '80 km/h'],
    correct: 1,
    explanation: 'La vitesse maximale d\'un PL de plus de 3,5t sur autoroute est de 90 km/h en France.'
  },
  // 2ndes CRM - CONDUITE
  {
    id: 'q5', type: 'qcm', level: '2ndes CRM', subject: 'CONDUITE', chapter: 'Les bases de la conduite PL',
    text: 'Quel est le principal risque lors d\'un virage serré avec un poids lourd ?',
    options: ['Le patinage des roues', 'Le renversement', 'La panne moteur', 'L\'aquaplaning'],
    correct: 1,
    explanation: 'Le risque de renversement est élevé en virage serré à cause du centre de gravité élevé du PL.'
  },
  {
    id: 'q6', type: 'qcm', level: '2ndes CRM', subject: 'CONDUITE', chapter: 'Manœuvres en marche arrière',
    text: 'Que devez-vous vérifier avant une manœuvre en marche arrière ?',
    options: ['Le niveau de carburant', 'L\'absence d\'obstacle derrière', 'La pression des pneus', 'Le tachygraphe'],
    correct: 1,
    explanation: 'Avant toute marche arrière, il est essentiel de vérifier qu\'il n\'y a aucun obstacle ni piéton derrière le véhicule.'
  },
  // 2ndes CRM - SECURITE
  {
    id: 'q7', type: 'qcm', level: '2ndes CRM', subject: 'SECURITE', chapter: 'Équipements de sécurité',
    text: 'Quel équipement est obligatoire dans un PL en France ?',
    options: ['GPS', 'Gilet haute visibilité', 'Dashcam', 'Climatisation'],
    correct: 1,
    explanation: 'Le gilet haute visibilité est obligatoire et doit être accessible depuis le poste de conduite.'
  },
  {
    id: 'q8', type: 'qcm', level: '2ndes CRM', subject: 'SECURITE', chapter: 'Premiers secours',
    text: 'Quel est le numéro d\'urgence européen ?',
    options: ['15', '112', '18', '114'],
    correct: 1,
    explanation: 'Le 112 est le numéro d\'urgence européen, accessible gratuitement dans tous les pays de l\'UE.'
  },
  // 1ères CRM - REGLEMENTATION
  {
    id: 'q9', type: 'qcm', level: '1ères CRM', subject: 'REGLEMENTATION', chapter: 'Temps de conduite et repos (EU 561/2006)',
    text: 'Quelle est la durée maximale de conduite journalière selon le règlement EU 561/2006 ?',
    options: ['8 heures', '9 heures', '10 heures', '12 heures'],
    correct: 1,
    explanation: 'La durée de conduite journalière est limitée à 9h, extensible à 10h deux fois par semaine (EU 561/2006).'
  },
  {
    id: 'q10', type: 'qcm', level: '1ères CRM', subject: 'REGLEMENTATION', chapter: 'Temps de conduite et repos (EU 561/2006)',
    text: 'Quelle est la durée minimale du repos journalier normal ?',
    options: ['9 heures', '10 heures', '11 heures', '12 heures'],
    correct: 2,
    explanation: 'Le repos journalier normal est de 11 heures consécutives minimum (EU 561/2006, art. 8).'
  },
  {
    id: 'q11', type: 'qcm', level: '1ères CRM', subject: 'REGLEMENTATION', chapter: 'Documents de transport',
    text: 'Quel document accompagne obligatoirement une marchandise transportée ?',
    options: ['La carte grise', 'La lettre de voiture (CMR)', 'Le permis de conduire', 'L\'attestation FIMO'],
    correct: 1,
    explanation: 'La lettre de voiture (CMR en international) est le contrat de transport qui accompagne la marchandise.'
  },
  // 1ères CRM - CONDUITE
  {
    id: 'q12', type: 'qcm', level: '1ères CRM', subject: 'CONDUITE', chapter: 'Conduite en conditions difficiles',
    text: 'Que faire en cas de brouillard épais avec un PL ?',
    options: ['Allumer les feux de route', 'Allumer les feux de brouillard et réduire la vitesse', 'Suivre le véhicule devant de près', 'S\'arrêter sur la bande d\'arrêt d\'urgence'],
    correct: 1,
    explanation: 'En cas de brouillard, il faut allumer les feux de brouillard avant et arrière et réduire significativement sa vitesse.'
  },
  {
    id: 'q13', type: 'qcm', level: '1ères CRM', subject: 'CONDUITE', chapter: 'Attelage et dételage',
    text: 'Quelle est la première opération lors d\'un attelage ?',
    options: ['Brancher les flexibles', 'Aligner le tracteur avec la remorque', 'Lever les béquilles', 'Vérifier la sellette'],
    correct: 1,
    explanation: 'L\'alignement du tracteur avec la remorque est la première étape pour assurer un attelage correct et sécurisé.'
  },
  // 1ères CRM - LOGISTIQUE
  {
    id: 'q14', type: 'qcm', level: '1ères CRM', subject: 'LOGISTIQUE', chapter: 'Chargement et arrimage',
    text: 'Comment doit être réparti le chargement dans un camion ?',
    options: ['Tout à l\'arrière', 'Tout à l\'avant', 'De manière homogène et équilibrée', 'Peu importe la répartition'],
    correct: 2,
    explanation: 'Le chargement doit être réparti de manière homogène pour garantir la stabilité et respecter les charges par essieu.'
  },
  // 1ères CRM - ETG
  {
    id: 'q15', type: 'qcm', level: '1ères CRM', subject: 'ETG', chapter: 'Code de la route approfondi',
    text: 'Quelle distance de sécurité minimale faut-il respecter entre deux PL sur autoroute ?',
    options: ['25 mètres', '50 mètres', '75 mètres', '100 mètres'],
    correct: 1,
    explanation: 'La distance de sécurité entre PL sur autoroute est d\'au moins 50 mètres (environ 2 secondes à 90 km/h).'
  },
  // Terminales CRM - CONDUITE
  {
    id: 'q16', type: 'qcm', level: 'Terminales CRM', subject: 'CONDUITE', chapter: 'Plateau C – Vérifications',
    text: 'Lors de l\'épreuve plateau C, que vérifie-t-on sur le système de freinage pneumatique ?',
    options: ['Le niveau d\'huile', 'La pression dans les réservoirs d\'air', 'La tension de la courroie', 'Le niveau de liquide de frein'],
    correct: 1,
    explanation: 'Sur un PL à freinage pneumatique, on vérifie la pression dans les réservoirs (minimum 8 bars au démarrage).'
  },
  {
    id: 'q17', type: 'qcm', level: 'Terminales CRM', subject: 'CONDUITE', chapter: 'Plateau CE – Ensemble articulé',
    text: 'Quel est le PTAC maximum d\'un ensemble articulé standard ?',
    options: ['19 tonnes', '26 tonnes', '38 tonnes', '44 tonnes'],
    correct: 3,
    explanation: 'Le PTAC max d\'un ensemble articulé est de 44 tonnes (40t standard + 4t si transport combiné rail-route).'
  },
  // Terminales CRM - REGLEMENTATION
  {
    id: 'q18', type: 'qcm', level: 'Terminales CRM', subject: 'REGLEMENTATION', chapter: 'RSE et chronotachygraphe',
    text: 'Combien de jours de données le chronotachygraphe numérique conserve-t-il ?',
    options: ['28 jours', '56 jours', '90 jours', '365 jours'],
    correct: 2,
    explanation: 'Le chronotachygraphe numérique conserve les données des 56 derniers jours (environ 2 mois).'
  },
  {
    id: 'q19', type: 'qcm', level: 'Terminales CRM', subject: 'REGLEMENTATION', chapter: 'Transport de matières dangereuses',
    text: 'Quelle formation est obligatoire pour transporter des matières dangereuses ?',
    options: ['FIMO', 'FCO', 'ADR', 'CACES'],
    correct: 2,
    explanation: 'La formation ADR (Accord européen relatif au transport international des marchandises Dangereuses par Route) est obligatoire.'
  },
  // Terminales CRM - LOGISTIQUE
  {
    id: 'q20', type: 'qcm', level: 'Terminales CRM', subject: 'LOGISTIQUE', chapter: 'Organisation du transport',
    text: 'Qu\'est-ce que le cabotage routier ?',
    options: [
      'Le transport entre deux pays différents',
      'Le transport national effectué par un transporteur étranger',
      'Le transport de marchandises en vrac',
      'Le transport express de colis'
    ],
    correct: 1,
    explanation: 'Le cabotage est le transport de marchandises à l\'intérieur d\'un pays par un transporteur non résident de ce pays.'
  },
  // Terminales CRM - ETG
  {
    id: 'q21', type: 'qcm', level: 'Terminales CRM', subject: 'ETG', chapter: 'Révisions ETG complètes',
    text: 'En agglomération, quelle est la vitesse maximale autorisée pour un PL ?',
    options: ['30 km/h', '50 km/h', '70 km/h', '80 km/h'],
    correct: 1,
    explanation: 'En agglomération, la vitesse est limitée à 50 km/h pour tous les véhicules, sauf indication contraire.'
  },
  // Terminales CRM - SECURITE
  {
    id: 'q22', type: 'qcm', level: 'Terminales CRM', subject: 'SECURITE', chapter: 'Éco-conduite et prévention',
    text: 'Quel comportement favorise l\'éco-conduite ?',
    options: [
      'Accélérer fortement puis freiner',
      'Anticiper le trafic et conduire en souplesse',
      'Rouler toujours au régime maximum',
      'Utiliser le frein moteur en permanence'
    ],
    correct: 1,
    explanation: 'L\'anticipation et la conduite en souplesse réduisent la consommation de carburant de 10 à 15%.'
  },
];
