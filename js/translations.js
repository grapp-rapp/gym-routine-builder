const GOAL_LABEL = { general: 'General fitness', fatloss: 'Fat loss', muscle: 'Build muscle', strength: 'Get stronger' };
const GOAL_LABEL_HE = { general: 'כושר כללי', fatloss: 'ירידה באחוזי שומן', muscle: 'בניית שריר', strength: 'התחזקות' };
const ISSUE_LABEL = { lowBack: 'low-back considerations', shoulder: 'shoulder considerations', knee: 'knee considerations', hip: 'hip considerations', neck: 'neck considerations', elbowWrist: 'elbow/wrist considerations' };
const ISSUE_LABEL_HE = { lowBack: 'גב תחתון', shoulder: 'כתף', knee: 'ברך', hip: 'ירך', neck: 'צוואר', elbowWrist: 'מרפק / שורש כף יד' };

const COPY = {
  en: {
    starter: 'STARTER PROGRAM', daysWeek: 'days / week', session: 'session length', experience: 'experience',
    day: 'Workout', exercise: 'Exercise', sets: 'Sets', reps: 'Reps / time', rest: 'Rest', equipment: 'Equipment', modified: 'MODIFIED',
    warmup: 'Warm-up', cardio: 'Weekly cardio', progress: 'How to progress', rules: 'First 4–6 weeks',
    rule1: 'Leave reps in reserve; do not train to failure.', rule2: 'Technique and comfortable range come before load.',
    rule3: 'Use controlled, comfortable movement and adjust any exercise that does not feel right.', rule4: 'Ask staff for a form check before increasing loads aggressively.',
    trainerNote: 'Trainer note', target: 'planned length', startAt: 'Starting effort', programAdjusted: 'Program adjusted for',
    painRule: 'Use a comfortable range and adjust any movement that does not suit the member.',
    noIssues: 'No movement considerations selected. Use controlled technique and a comfortable range.',
    memberNote: 'Member note', minor: 'Minor member', minorText: 'Follow the gym’s youth-supervision policy and applicable instructor requirements.',
    equipmentGuide: 'Equipment', prev: 'Previous workout', next: 'Next workout', routineFor: 'Routine for',
    replace: 'Replace', edited: 'TRAINER EDIT', swapTitle: 'Replace exercise', saveChange: 'Save change',
    resetExercise: 'Reset to generated', recommended: 'Recommended', allSafe: 'All suitable exercises',
    referenceImage: 'Equipment reference drawing. Ask staff to identify your gym’s exact machine.'
  },
  he: {
    starter: 'תוכנית התחלה', daysWeek: 'אימונים בשבוע', session: 'משך אימון', experience: 'רמת ניסיון',
    day: 'אימון', exercise: 'תרגיל', sets: 'סטים', reps: 'חזרות / זמן', rest: 'מנוחה', equipment: 'ציוד', modified: 'מותאם',
    warmup: 'חימום', cardio: 'אירובי שבועי', progress: 'איך מתקדמים', rules: 'כללים ל־4–6 השבועות הראשונים',
    rule1: 'השאירו חזרות ברזרבה ואל תתאמנו עד כשל.', rule2: 'טכניקה וטווח תנועה נוח קודמים להוספת משקל.',
    rule3: 'עבדו בתנועה מבוקרת ונוחה והתאימו כל תרגיל שאינו מרגיש מתאים.', rule4: 'בקשו מאיש צוות לבדוק טכניקה לפני העלאה משמעותית של המשקל.',
    trainerNote: 'הערת מאמן', target: 'משך מתוכנן', startAt: 'עצימות התחלתית', programAdjusted: 'התוכנית הותאמה עבור',
    painRule: 'עבדו בטווח נוח והתאימו כל תנועה שאינה מתאימה למתאמן.',
    noIssues: 'לא סומנו מגבלות תנועה. יש לעבוד בטכניקה מבוקרת ובטווח נוח.',
    memberNote: 'הערת מתאמן', minor: 'מתאמן קטין', minorText: 'יש לפעול לפי מדיניות הפיקוח לנוער ודרישות ההדרכה הרלוונטיות.',
    equipmentGuide: 'ציוד', prev: 'האימון הקודם', next: 'האימון הבא', routineFor: 'תוכנית עבור',
    replace: 'החלפה', edited: 'נערך ע״י מאמן', swapTitle: 'החלפת תרגיל', saveChange: 'שמירת שינוי',
    resetExercise: 'חזרה לתרגיל המקורי', recommended: 'מומלץ', allSafe: 'כל התרגילים המתאימים',
    referenceImage: 'איור ציוד להמחשה. בקשו מהצוות לזהות את המכשיר המדויק בחדר הכושר.'
  }
};

