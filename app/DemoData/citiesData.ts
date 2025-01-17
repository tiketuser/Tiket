const citiesData= ["סנסנה", "קצר א-סר", "כמאנה", "חברון", "אעצם (שבט)", "אבירים", "אבו עבדון (שבט)", "אבו עמאר (שבט)", "אבו עמרה (שבט)", "אבו גוש", "אבו ג'ווייעד (שבט)", "אבו קרינאת (יישוב)", "אבו קורינאת (שבט)", "אבו רובייעה (שבט)", "אבו רוקייק (שבט)", "אבו סנאן", "אבו סריחאן (שבט)", "אבו תלול", "אדמית", "עדנים", "אדרת", "אדירים", "עדי", "אדורה", "אפיניש (שבט)", "אפק", "אפיק", "אפיקים", "עפולה", "עגור", "אחווה", "אחיעזר", "אחיהוד", "אחיסמך", "אחיטוב", "אחוזם", "אחוזת ברק", "עכו", "אל סייד", "אל-עריאן", "אל-עזי", "עלי זהב", "אלפי מנשה", "אלון הגליל", "אלון שבות", "אלוני אבא", "אלוני הבשן", "אלוני יצחק", "אלונים", "עלמה", "אלמגור", "אלמוג", "עלמון", "עלומים", "אלומה", "אלומות", "אמציה", "עמיר", "אמירים", "עמיעד", "עמיעוז", "עמיחי", "עמינדב", "עמיקם", "אמנון", "עמקה", "עמוקה", "אניעם", "ערערה", "ערערה-בנגב", "ערד", "עראמשה", "ארבל", "ארגמן", "אריאל", "ערב אל נעים", "עראבה", "ארסוף", "ערוגות", "עשהאל", "אסד (שבט)", "אספר", "עשרת", "אשלים", "אשדוד", "אשדות יעקב (איחוד)", "אשדות יעקב (מאוחד)", "אשרת", "אשקלון", "עטאוונה (שבט)", "עטרת", "עתלית", "אטרש (שבט)", "עצמון שגב", "עבדון", "אבנת", "אביאל", "אביעזר", "אביגיל", "אביגדור", "אביחיל", "אביטל", "אביבים", "אבני איתן", "אבני חפץ", "אבשלום", "אבטליון", "עיינות", "איילת השחר", "עזריה", "אזור", "עזריאל", "עזריקם", "בחן", "בלפוריה", "באקה אל-גרביה", "בר גיורא", "בר יוחאי", "ברעם", "ברק", "ברקת", "ברקן", "ברקאי", "בסמ\"ה", "בסמת טבעון", "בת עין", "בת הדר", "בת חפר", "בת חן", "בת שלמה", "בת ים", "בצרה", "באר מילכה", "באר אורה", "באר שבע", "באר טוביה", "באר יעקב", "בארי", "בארות יצחק", "בארותיים", "באר גנים", "בית ג'ן", "בן עמי", "בן שמן (מושב)", "בן שמן (כפר נוער)", "בן זכאי", "בניה", "בני עטרות", "בני עי\"ש", "בני ברק", "בני דרום", "בני דרור", "בני נצרים", "בני ראם", "בני יהודה", "בני ציון", "בקעות", "בקוע", "ברכה", "ברכיה", "ברור חיל", "ברוש", "בית אלפא", "בית עריף", "בית אריה", "בית ברל", "בית דגן", "בית אל", "בית אלעזרי", "בית עזרא", "בית גמליאל", "בית גוברין", "בית הערבה", "בית העמק", "בית הגדי", "בית הלוי", "בית חנן", "בית חנניה", "בית השיטה", "בית חשמונאי", "בית חירות", "בית הלל", "בית חלקיה", "בית חגלה", "בית חורון", "בית לחם הגלילית", "בית מאיר", "בית נחמיה", "בית נקופה", "בית ניר", "בית אורן", "בית עובד", "בית קמה", "בית קשת", "בית רבן", "בית רימון", "בית שאן", "בית שערים", "בית שמש", "בית שקמה", "בית עוזיאל", "בית ינאי", "בית יהושע", "בית יצחק-שער חפר", "בית יוסף", "בית זית", "בית זיד", "בית זרע", "בית צבי", "ביתר עילית", "בצת", "בענה", "בנימינה-גבעת עדה", "ביר אל-מכסור", "ביר הדאג'", "ביריה", "ביתן אהרן", "בטחה", "ביצרון", "בני דקלים", "ברוכין", "בועיינה-נוג'ידאת", "בוקעאתא", "בורגתה", "בוסתן הגליל", "דבוריה", "דפנה", "דחי", "דאלית אל-כרמל", "דליה", "דלתון", "דן", "דברת", "דגניה א'", "דגניה ב'", "דייר אל-אסד", "דייר חנא", "דייר ראפאת", "דמיידה", "דקל", "דריג'את", "דבורה", "דימונה", "דישון", "דולב", "דור", "דורות", "דוב\"ב", "דביר", "אפרת", "עיילבון", "עין אל-אסד", "עין חוד", "עין מאהל", "עין נקובא", "עין קנייא", "עין ראפה", "אלעד", "אלעזר", "אל-רום", "אילת", "עלי", "אלי-עד", "אליאב", "אליפז", "אליפלט", "אלישמע", "אילון", "אלון מורה", "אילות", "אלקנה", "אלקוש", "אליכין", "אליקים", "אלישיב", "אמונים", "עין איילה", "עין דור", "עין גדי", "עין גב", "עין הבשור", "עין העמק", "עין החורש", "עין המפרץ", "עין הנצי\"ב", "עין חרוד (איחוד)", "עין חרוד (מאוחד)", "עין השלושה", "עין השופט", "עין חצבה", "עין הוד", "עין עירון", "עין כרם-בי\"ס חקלאי", "עין כרמל", "עין שריד", "עין שמר", "עין תמר", "עין ורד", "עין יעקב", "עין יהב", "עין זיוון", "עין צורים", "עינת", "ענב", "ארז", "אשבול", "אשל הנשיא", "אשחר", "אשכולות", "אשתאול", "איתן", "איתנים", "אתגר", "אבן מנחם", "אבן ספיר", "אבן שמואל", "אבן יהודה", "גלעד (אבן יצחק)", "עברון", "אייל", "עזר", "עזוז", "פסוטה", "פוריידיס", "געש", "געתון", "גדיש", "גדות", "גלאון", "גן הדרום", "גן השומרון", "גן חיים", "גן נר", "גן שלמה", "גן שמואל", "גן שורק", "גן יבנה", "גן יאשיה", "גני עם", "גני הדר", "גני מודיעין", "גני טל", "גני תקווה", "גני יוחנן", "גנות", "גנות הדר", "גת רימון", "גת (קיבוץ)", "גזית", "גיאה", "גאליה", "גאולי תימן", "גאולים", "גדרה", "גפן", "גליל ים", "גרופית", "גשר", "גשר הזיו", "גשור", "גבע", "גבע כרמל", "גבע בנימין", "גבעות בר", "גברעם", "גבת", "גבים", "גבולות", "גזר", "ע'ג'ר", "גיבתון", "גדעונה", "גילת", "גלגל", "גילון", "גמזו", "גינתון", "גיניגר", "גינוסר", "גיתה", "גיתית", "גבעת אבני", "גבעת ברנר", "גבעת אלה", "גבעת השלושה", "גבעת חיים (איחוד)", "גבעת חיים (מאוחד)", "גבעת ח\"ן", "גבעת כ\"ח", "גבעת ניל\"י", "גבעת עוז", "גבעת שפירא", "גבעת שמש", "גבעת שמואל", "גבעת יערים", "גבעת ישעיהו", "גבעת יואב", "גבעת זאב", "גבעתיים", "גבעתי", "גבעולים", "גבעון החדשה", "גבעות עדן", "גבעות הרואה", "גיזו", "גונן", "גורן", "גורנות הגליל", "הבונים", "חד-נס", "הדר עם", "חדרה", "חדיד", "חפץ חיים", "חגי", "חגור", "הגושרים", "החותרים", "חיפה", "חלוץ", "המעפיל", "חמדיה", "חמאם", "חמרה", "חניתה", "חנתון", "חניאל", "העוגן", "האון", "הר אדר", "הר עמשא", "הר גילה", "הראל", "הררית", "חרשים", "הרדוף", "חריש", "חרוצים", "חשמונאים", "הסוללים", "חספין", "חבצלת השרון", "הוואשלה (שבט)", "היוגב", "חצב", "חצרים", "חצבה", "חזון", "חצור הגלילית", "חצור-אשדוד", "הזורעים", "הזורע", "חפצי-בה", "חלץ", "חמד", "חרב לאת", "חרמש", "חירות", "הרצליה", "חבר", "חיבת ציון", "הילה", "חיננית", "הוד השרון", "הודיות", "הודיה", "חופית", "חגלה", "חולית", "חולון", "חורשים", "חוסן", "הושעיה", "חוג'ייראת (ד'הרה)", "חולתה", "חולדה", "חוקוק", "חורה", "חורפיש", "חוסנייה", "הוזייל (שבט)", "אעבלין", "איבים", "אבטין", "עידן", "אכסאל", "אילניה", "עילוט", "עמנואל", "עיר אובות", "אירוס", "עספיא", "איתמר", "ג'ת", "ג'לג'וליה", "ירושלים", "ג'ש (גוש חלב)", "ג'סר א-זרקא", "ג'דיידה-מכר", "ג'ולס", "ג'נאביב (שבט)", "כעביה-טבאש-חג'אג'רה", "כברי", "כאבול", "כדיתה", "כדורי", "כפר ברא", "כפר כמא", "כפר כנא", "כפר מנדא", "כפר מצר", "כפר קרע", "כפר קאסם", "כפר יאסיף", "כחל", "כלנית", "כמון", "כנף", "כנות", "כאוכב אבו אל-היג'א", "כרי דשא", "כרכום", "כרמי קטיף", "כרמי יוסף", "כרמי צור", "כרמל", "כרמיאל", "כרמיה", "כפר אדומים", "כפר אחים", "כפר אביב", "כפר עבודה", "כפר עזה", "כפר ברוך", "כפר ביאליק", "כפר ביל\"ו", "כפר בן נון", "כפר בלום", "כפר דניאל", "כפר עציון", "כפר גלים", "כפר גדעון", "כפר גלעדי", "כפר גליקסון", "כפר חב\"ד", "כפר החורש", "כפר המכבי", "כפר הנגיד", "כפר חנניה", "כפר הנשיא", "כפר הנוער הדתי", "כפר האורנים", "כפר הרי\"ף", "כפר הרא\"ה", "כפר חרוב", "כפר חסידים א'", "כפר חסידים ב'", "כפר חיים", "כפר הס", "כפר חיטים", "כפר חושן", "כפר קיש", "כפר מל\"ל", "כפר מסריק", "כפר מימון", "כפר מנחם", "כפר מונש", "כפר מרדכי", "כפר נטר", "כפר פינס", "כפר ראש הנקרה", "כפר רוזנואלד (זרעית)", "כפר רופין", "כפר רות", "כפר סבא", "כפר שמאי", "כפר שמריהו", "כפר שמואל", "כפר סילבר", "כפר סירקין", "כפר סאלד", "כפר תפוח", "כפר תבור", "כפר טרומן", "כפר אוריה", "כפר ויתקין", "כפר ורבורג", "כפר ורדים", "כפר יעבץ", "כפר יחזקאל", "כפר יהושע", "כפר יונה", "כפר זיתים", "כפר זוהרים", "כליל", "כמהין", "כרמים", "כרם בן שמן", "כרם בן זמרה", "כרם ביבנה (ישיבה)", "כרם מהר\"ל", "כרם שלום", "כסלון", "ח'ואלד (שבט)", "ח'ואלד", "כנרת (מושבה)", "כנרת (קבוצה)", "כישור", "כסרא-סמיע", "כיסופים", "כחלה", "כוכב השחר", "כוכב מיכאל", "כוכב יעקב", "כוכב יאיר", "כורזים", "כסיפה", "להב", "להבות הבשן", "להבות חביבה", "לכיש", "לפיד", "לפידות", "לקיה", "לביא", "לבון", "להבים", "שריגים (לי-און)", "לימן", "לבנים", "לוד", "לוחמי הגיטאות", "לוטן", "לוטם", "לוזית", "מעגן", "מעגן מיכאל", "מעלה אדומים", "מעלה עמוס", "מעלה אפרים", "מעלה גמלא", "מעלה גלבוע", "מעלה החמישה", "מעלה עירון", "מעלה לבונה", "מעלה מכמש", "מעלות-תרשיחא", "מענית", "מעש", "מעברות", "מעגלים", "מעון", "מאור", "מעוז חיים", "מעין ברוך", "מעין צבי", "מבועים", "מגן", "מגן שאול", "מגל", "מגשימים", "מחניים", "צוקים", "מחנה הילה", "מחנה מרים", "מחנה טלי", "מחנה תל נוף", "מחנה יפה", "מחנה יתיר", "מחנה יהודית", "מחנה יוכבד", "מחסיה", "מג'ד אל-כרום", "מג'דל שמס", "מכחול", "מלכיה", "מנוף", "מנות", "מנשית זבדה", "מרגליות", "מסעדה", "מסעודין אל-עזאזמה", "משאבי שדה", "משען", "משכיות", "מסלול", "מסד", "מסדה", "משואה", "משואות יצחק", "מטע", "מתן", "מתת", "מתתיהו", "מבקיעים", "מזכרת בתיה", "מצליח", "מזור", "מזרעה", "מצובה", "מי עמי", "מאיר שפיה", "מעונה", "מפלסים", "מגדים", "מגידו", "מחולה", "מייסר", "מכורה", "מלאה", "מלילות", "מנחמיה", "מנרה", "מנוחה", "מירב", "מרחב עם", "מרחביה (מושב)", "מרחביה (קיבוץ)", "מרכז שפירא", "מרום גולן", "מירון", "מישר", "משהד", "מסילת ציון", "מסילות", "מיטל", "מיתר", "מיטב", "מטולה", "מבשרת ציון", "מבוא ביתר", "מבוא דותן", "מבוא חמה", "מבוא חורון", "מבוא מודיעים", "מבואות ים", "מבואות יריחו", "מצדות יהודה", "מיצר", "מצר", "מעיליא", "מדרך עוז", "מדרשת בן גוריון", "מדרשת רופין", "מגדל", "מגדל העמק", "מגדל עוז", "מגדלים", "מכמנים", "מכמורת", "מקווה ישראל", "משגב עם", "משגב דב", "משמר איילון", "משמר דוד", "משמר העמק", "משמר הנגב", "משמר השרון", "משמר השבעה", "משמר הירדן", "משמר יהודה", "משמרות", "משמרת", "מצפה אילן", "מבטחים", "מצפה", "מצפה אבי\"ב", "מצפה נטופה", "מצפה רמון", "מצפה שלם", "מצפה יריחו", "מזרע", "מודיעין עילית", "מודיעין-מכבים-רעות", "מולדת", "מורן", "מורשת", "מוצא עילית", "מגאר", "מוקייבלה", "נעלה", "נען", "נערן", "נאעורה", "נעמ\"ה", "אשבל", "חמדת", "נחל עוז", "שיטים", "נחלה", "נהלל", "נחליאל", "נחם", "נהריה", "נחף", "נחשולים", "נחשון", "נחשונים", "נצאצרה (שבט)", "נטף", "נטור", "נווה", "נצרת", "נאות גולן", "נאות הכיכר", "נאות מרדכי", "נעורים", "נגבה", "נגוהות", "נחלים", "נהורה", "נחושה", "ניין", "נס עמים", "נס הרים", "נס ציונה", "נשר", "נטע", "נטעים", "נתניה", "נתיב העשרה", "נתיב הגדוד", "נתיב הל\"ה", "נתיב השיירה", "נתיבות", "נטועה", "נבטים", "נוה צוף", "נווה אטי\"ב", "נווה אבות", "נווה דניאל", "נווה איתן", "נווה חריף", "נווה אילן", "נווה מיכאל", "נווה מבטח", "נווה שלום", "נווה אור", "נווה ים", "נווה ימין", "נווה ירק", "נווה זיו", "נווה זוהר", "נצר חזני", "נצר סרני", "ניל\"י", "נמרוד", "ניר עם", "ניר עקיבא", "ניר בנים", "ניר דוד (תל עמל)", "ניר אליהו", "ניר עציון", "ניר גלים", "ניר ח\"ן", "ניר משה", "ניר עוז", "ניר יפה", "ניר ישראל", "ניר יצחק", "ניר צבי", "נירים", "נירית", "ניצן", "ניצן ב'", "ניצנה (קהילת חינוך)", "ניצני עוז", "ניצני סיני", "ניצנים", "נועם", "נוף איילון", "נוף הגליל", "נופך", "נופים", "נופית", "נוגה", "נוקדים", "נורדיה", "נוב", "נורית", "אודם", "אופקים", "עופר", "עופרה", "אוהד", "עולש", "אומן", "עומר", "אומץ", "אור עקיבא", "אור הגנוז", "אור הנר", "אור יהודה", "אורה", "אורנים", "אורנית", "אורות", "אורטל", "עתניאל", "עוצם", "פעמי תש\"ז", "פלמחים", "פארן", "פרדס חנה-כרכור", "פרדסיה", "פרוד", "פטיש", "פדיה", "פדואל", "פדויים", "פלך", "פני חבר", "פקיעין (בוקייעה)", "פקיעין חדשה", "פרזון", "פרי גן", "פסגות", "פתח תקווה", "פתחיה", "פצאל", "פורת", "פוריה עילית", "פוריה - כפר עבודה", "פוריה - נווה עובד", "קבועה (שבט)", "קדרים", "קדימה-צורן", "קלנסווה", "קליה", "קרני שומרון", "קוואעין (שבט)", "קציר", "קצרין", "קדר", "קדמה", "קדומים", "קלע", "קלחים", "קיסריה", "קשת", "קטורה", "קבוצת יבנה", "קדמת צבי", "קדרון", "קרית ענבים", "קרית ארבע", "קרית אתא", "קרית ביאליק", "קרית עקרון", "קרית גת", "קרית מלאכי", "קרית מוצקין", "קרית נטפים", "קרית אונו", "קרית שלמה", "קרית שמונה", "קרית טבעון", "קרית ים", "קרית יערים", "קרית יערים(מוסד)", "קוממיות", "קורנית", "קודייראת א-צאנע(שבט)", "רעננה", "רהט", "רם-און", "רמת דוד", "רמת גן", "רמת הכובש", "רמת השרון", "רמת השופט", "רמת מגשימים", "רמת רחל", "רמת רזיאל", "רמת ישי", "רמת יוחנן", "רמת צבי", "ראמה", "רמלה", "רמות", "רמות השבים", "רמות מאיר", "רמות מנשה", "רמות נפתלי", "רנן", "רקפת", "ראס אל-עין", "ראס עלי", "רביד", "רעים", "רגבים", "רגבה", "ריחן", "רחלים", "רחוב", "רחובות", "ריחאניה", "ריינה", "רכסים", "רשפים", "רתמים", "רבדים", "רבבה", "רביבים", "רווחה", "רוויה", "רימונים", "רינתיה", "ראשון לציון", "רשפון", "רועי", "ראש העין", "ראש פינה", "ראש צורים", "רותם", "רוח מדבר", "רוחמה", "רומת הייב", "רומאנה", "סעד", "סער", "סעוה", "סאג'ור", "סח'נין", "סלעית", "סלמה", "סמר", "צנדלה", "ספיר", "שריד", "סאסא", "סביון", "סואעד (כמאנה) (שבט)", "סואעד (חמרייה)", "סייד (שבט)", "שדי אברהם", "שדה בוקר", "שדה דוד", "שדה אליעזר", "שדה אליהו", "שדי חמד", "שדה אילן", "שדה משה", "שדה נחום", "שדה נחמיה", "שדה ניצן", "שדי תרומות", "שדה עוזיהו", "שדה ורבורג", "שדה יעקב", "שדה יצחק", "שדה יואב", "שדה צבי", "שדרות", "שדות מיכה", "שדות ים", "שגב-שלום", "סגולה", "שניר", "שעב", "שעל", "שעלבים", "שער אפרים", "שער העמקים", "שער הגולן", "שער מנשה", "שער שומרון", "שדמות דבורה", "שדמות מחולה", "שפיר", "שחר", "שחרית", "שחרות", "שלווה במדבר", "שלווה", "שמרת", "שמיר", "שני", "שקד", "שרונה", "שרשרת", "שבי דרום", "שבי שומרון", "שבי ציון", "שאר ישוב", "שדמה", "שפרעם", "שפיים", "שפר", "שייח' דנון", "שכניה", "שלומי", "שלוחות", "שקף", "שתולה", "שתולים", "שיזף", "שזור", "שיבולים", "שבלי - אום אל-גנם", "שילת", "שילה", "שמעה", "שמשית", "נאות סמדר", "שלומית", "שואבה", "שוהם", "שומרה", "שומריה", "שוקדה", "שורשים", "שורש", "שושנת העמקים", "צוקי ים", "שובל", "שובה", "סתריה", "סופה", "סולם", "סוסיה", "תעוז", "טל שחר", "טל-אל", "תלמי ביל\"ו", "תלמי אלעזר", "תלמי אליהו", "תלמי יפה", "תלמי יחיאל", "תלמי יוסף", "טלמון", "טמרה", "טמרה (יזרעאל)", "תראבין א-צאנע (שבט)", "תראבין א-צאנע(ישוב)", "תרום", "טייבה", "טייבה (בעמק)", "תאשור", "טפחות", "תל עדשים", "תל אביב - יפו", "תל מונד", "תל קציר", "תל שבע", "תל תאומים", "תל ציון", "תל יצחק", "תל יוסף", "טללים", "תלמים", "תלם", "טנא", "תנובות", "תקוע", "תקומה", "טבריה", "תדהר", "תפרח", "תימורים", "תמרת", "טירת כרמל", "טירת יהודה", "טירת צבי", "טירה", "תירוש", "תומר", "רמת טראמפ", "טובא-זנגריה", "טורעאן", "תושיה", "תובל", "אודים", "אום אל-פחם", "אום אל-קוטוף", "אום בטין", "עוקבי (בנו עוקבה)", "אורים", "אושה", "עוזה", "עוזייר", "ורדון", "ורד יריחו", "יעד", "יערה", "יעל", "יד בנימין", "יד חנה", "יד השמונה", "יד מרדכי", "יד נתן", "יד רמב\"ם", "יפיע", "יפית", "יגל", "יגור", "יהל", "יכיני", "יאנוח-ג'ת", "ינוב", "יקיר", "יקום", "ירדנה", "ירחיב", "ירקונה", "יסעור", "ישרש", "יתד", "יבנה", "יבנאל", "יציץ", "יעף", "ידידה", "כפר ידידיה", "יחיעם", "יהוד-מונוסון", "ירוחם", "ישע", "יסודות", "יסוד המעלה", "יבול", "יפעת", "יפתח", "ינון", "יראון", "ירכא", "ישעי", "ייט\"ב", "יצהר", "יזרעאל", "יודפת", "יונתן", "יקנעם עילית", "יקנעם (מושבה)", "יושיביה", "יטבתה", "יובל", "יובלים", "זבארגה (שבט)", "צפרירים", "צפריה", "זנוח", "זרזיר", "זבדיאל", "צאלים", "צפת", "זכריה", "צלפון", "זמר", "זרחיה", "זרועה", "צרופה", "זיתן", "זכרון יעקב", "זמרת", "ציפורי", "זיקים", "צבעון", "צופר", "צופית", "צופיה", "זוהר", "צוחר", "צרעה", "צובה", "צופים", "צור הדסה", "צור משה", "צור נתן", "צור יצחק", "צוריאל", "צורית", "צביה"]
export default citiesData;