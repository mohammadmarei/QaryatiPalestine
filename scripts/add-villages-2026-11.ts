/*
 * Adds two villages documented after the seed: Burqin (Jenin) and Beit Ummar (Hebron).
 *
 *   node scripts/add-villages-2026-11.ts --dry-run   print what would be written
 *   node scripts/add-villages-2026-11.ts             write (refuses if either village already exists)
 *
 * Every fact comes from the English Wikipedia articles (read 22 November 2026) and the primary sources they
 * cite; figures from a primary source the database already holds cite that source (Barron 1923, Mills 1932,
 * Village Statistics 1945, Hütteroth & Abdulfattah 1977, the 1961 Jordanian census, PCBS 2017, the SWP).
 * What the articles do not give (elevation, today's land area, a 1997 figure, distances) stays empty.
 * Photos: Wikimedia Commons, with author and licence in the caption. Both villages start as pending review.
 * Same key and Admin SDK as scripts/import-seed.ts.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { hashString } from '../src/utils/misc.ts'

const PROJECT_ID = 'qaryati-36f85'
const dryRun = process.argv.includes('--dry-run')
const at = new Date().toISOString()
const READ = '2026-11-22'

// Existing sources (see data/qaryati_seed.mysql.sql)
const PCBS_2017 = '1'
const BARRON_1923 = '3'
const HUTTEROTH_1977 = '4'
const MILLS_1932 = '5'
const VILLAGE_STATS_1945 = '6'
const SWP = '7'
const JORDAN_1961 = '8'
const COMMONS = '9'
// New sources
const WIKI_BURQIN = '26'
const WIKI_BEIT_UMMAR = '27'
const PERLMANN_1967 = '28'
const PCBS_2007 = '29'

const newSources: Record<string, Record<string, unknown>> = {
  [WIKI_BURQIN]: {
    title: 'Burqin, Palestine',
    type: 'website',
    organization: 'Wikipedia',
    reference: 'Wikipedia: Burqin, Palestine',
    url: 'https://en.wikipedia.org/wiki/Burqin,_Palestine',
    publishedAt: '',
    accessedAt: READ,
    note: { ar: 'مقال ويكيبيديا الإنجليزية عن برقين، ويستشهد بالمصادر الأصلية (غيرين، كوندر، رسائل تل العمارنة).', en: 'English Wikipedia article on Burqin; cites the original sources (Guérin, Conder, the Amarna letters).' },
  },
  [WIKI_BEIT_UMMAR]: {
    title: 'Beit Ummar',
    type: 'website',
    organization: 'Wikipedia',
    reference: 'Wikipedia: Beit Ummar',
    url: 'https://en.wikipedia.org/wiki/Beit_Ummar',
    publishedAt: '',
    accessedAt: READ,
    note: { ar: 'مقال ويكيبيديا الإنجليزية عن بيت أمّر، ويستشهد بالمصادر الأصلية (غيرين، شارون، غروسمان، بركمي وأفي يونا).', en: 'English Wikipedia article on Beit Ummar; cites the original sources (Guérin, Sharon, Grossman, Baramki and Avi-Yonah).' },
  },
  [PERLMANN_1967]: {
    title: 'The 1967 Census of the West Bank and Gaza Strip: A Digitized Version',
    type: 'census',
    author: 'Joel Perlmann',
    organization: 'Levy Economics Institute of Bard College',
    reference: 'Perlmann 2011–2012',
    url: 'https://www.levyinstitute.org/publications/the-1967-census-of-the-west-bank-and-gaza-strip-a-digitized-version',
    publishedAt: '2012-01-01',
    accessedAt: READ,
    note: { ar: 'تعداد أجرته سلطات الاحتلال الإسرائيلي عام 1967، كما تنقله مقالات ويكيبيديا.', en: 'Census held by the Israeli authorities in 1967, as cited in Wikipedia.' },
  },
  [PCBS_2007]: {
    title: 'Population, Housing and Establishments Census 2007: Locality Population Statistics',
    type: 'census',
    organization: 'Palestinian Central Bureau of Statistics (PCBS)',
    reference: 'PCBS 2007',
    url: 'https://www.pcbs.gov.ps',
    publishedAt: '2009-01-01',
    accessedAt: READ,
    note: { ar: 'التعداد العام للسكان والمساكن والمنشآت 2007، كما تنقله مقالات ويكيبيديا.', en: 'Census of 2007, as cited in Wikipedia.' },
  },
}

const art = (id: string) => {
  const h = hashString(id)
  return { scene: ['terraces', 'grove', 'ruins', 'hilltop', 'valley', 'plain'][h % 6], palette: (h >>> 8) % 6 }
}

const villages: Record<string, Record<string, unknown>> = {
  burqin: {
    name: { ar: 'برقين', en: 'Burqin' },
    altSpellings: ['Birqin'],
    historicalNames: [
      { name: { ar: 'برقانة', en: 'Burqana' }, period: '14th century BCE', kind: 'historical', meaning: 'Name in the Amarna letters.', sourceId: WIKI_BURQIN },
      { name: { ar: 'بروقين', en: 'Bruqin' }, period: '1596', kind: 'historical', meaning: 'Spelling in the Ottoman tax register.', sourceId: HUTTEROTH_1977 },
      { name: { ar: 'بركين', en: 'Berkin' }, period: '1799', kind: 'historical', meaning: "Spelling on Pierre Jacotin's map.", sourceId: WIKI_BURQIN },
      { name: { ar: 'بركين', en: 'Burkin' }, period: '1882', kind: 'historical', meaning: 'Spelling in the Survey of Western Palestine.', sourceId: SWP },
    ],
    governorateId: 'jenin',
    adminArea: { ar: 'محافظة جنين', en: 'Jenin Governorate' },
    description: {
      ar: 'بلدة فلسطينية في شمال الضفة الغربية، على بُعد نحو 5 كم غرب جنين، في محافظة جنين. بلغ عدد سكانها 5,685 نسمة عام 2007 و7,126 نسمة عام 2017 وفق الجهاز المركزي للإحصاء الفلسطيني. غالبية سكانها مسلمون، وفيها نحو 20 عائلة مسيحية. تضم كنيسة القديس جاورجيوس البيزنطية، التي توصف بأنها من أقدم الكنائس في العالم.',
      en: 'A Palestinian town in the northern West Bank, about 5 km west of Jenin, in Jenin Governorate. Its population was 5,685 in 2007 and 7,126 in 2017, according to the Palestinian Central Bureau of Statistics. Most residents are Muslim, with about 20 Christian families. It is home to the Byzantine-era Church of St George, described as one of the oldest churches in the world.',
    },
    coordinates: { lat: 32.45556, lng: 35.26028 },
    nearby: [],
    history: {
      overview: {
        ar: 'ذُكرت باسم «برقانة» في رسائل تل العمارنة في القرن الرابع عشر قبل الميلاد. سُجّلت في دفتر الضرائب العثماني عام 1596، ووصفها الرحالة فكتور غيرين عام 1863، ومسح فلسطين الغربية عام 1882. خضعت للحكم الأردني بعد 1948، وتقع تحت الاحتلال الإسرائيلي منذ 1967.',
        en: 'Mentioned as "Burqana" in the Amarna letters of the 14th century BCE. It was recorded in the Ottoman tax register of 1596, and described by Victor Guérin in 1863 and by the Survey of Western Palestine in 1882. It came under Jordanian rule after 1948 and has been under Israeli occupation since 1967.',
      },
      nameOrigin: { ar: 'أرض رملية يغطيها الصوّان، بحسب بالمر (1881).', en: 'Sandy soil covered with flint, according to Palmer (1881).' },
      events: [
        { id: 'ev-burqin-1', year: '', title: { ar: 'ذكرها في رسائل تل العمارنة (القرن 14 ق.م)', en: 'Named in the Amarna letters (14th century BCE)' }, description: { ar: 'وردت باسم «برقانة» بين المدن التي استولى عليها لبعايو في وادي دوثان وجنوب مرج ابن عامر.', en: 'Listed as "Burqana" among the towns taken by the warlord Lab\'ayu in the Dothan Valley and the southern Jezreel Valley.' }, sourceId: WIKI_BURQIN },
        { id: 'ev-burqin-2', year: '1596', title: { ar: 'تسجيلها في دفتر الضرائب العثماني', en: 'Recorded in the Ottoman tax register' }, description: { ar: 'ناحية جبل سامي، لواء نابلس: 23 أسرة و4 عزّاب مسلمين. دفعت الضرائب على القمح والشعير والمحاصيل الصيفية والزيتون والماعز وخلايا النحل. (السنة فقط موثّقة)', en: 'Nahiya of Jabal Sami, Liwa of Nablus: 23 households and 4 bachelors, all Muslim. Taxes were paid on wheat, barley, summer crops, olive trees, goats and beehives. (Only the year is documented.)' }, sourceId: HUTTEROTH_1977 },
        { id: 'ev-burqin-3', year: '1863', title: { ar: 'زيارة فكتور غيرين', en: "Victor Guérin's visit" }, description: { ar: 'قدّر عدد سكانها بنحو ألف، مسلمون عدا 90 من الروم الأرثوذكس، وأحصى نحو 30 بئرًا منقورة رأى فيها دليلًا على استيطان قديم. (السنة فقط موثّقة)', en: 'He counted about 1,000 inhabitants, all Muslim except 90 Greek Orthodox, and about 30 rock-cut cisterns, which he took as evidence of an ancient settlement. (Only the year is documented.)' }, sourceId: WIKI_BURQIN },
        { id: 'ev-burqin-4', year: '1872', title: { ar: 'وصف كوندر للكنيسة', en: "Conder's description of the church" }, description: { ar: 'زار كلود كوندر الكنيسة، ولاحظ حاجزًا حجريًا في الشرق يفصل ثلاث حنيات. (السنة فقط موثّقة)', en: 'Claude Conder visited the church and noted a stone screen on the east side shutting off three apses. (Only the year is documented.)' }, sourceId: WIKI_BURQIN },
        { id: 'ev-burqin-5', year: '1882', title: { ar: 'وصفها في مسح فلسطين الغربية', en: 'Described in the Survey of Western Palestine' }, description: { ar: 'قرية فيها مسيحيون من الروم وكنيسة حديثة صغيرة، وحولها زيتون، وبئر جيدة في الأسفل إلى الشمال. (السنة فقط موثّقة)', en: 'A village with Greek Christians and a small modern church, olives near it and a good well below on the north. (Only the year is documented.)' }, sourceId: SWP },
        { id: 'ev-burqin-6', year: '1945', title: { ar: 'إحصاءات القرى', en: 'Village Statistics' }, description: { ar: 'بلغت مساحة أراضيها 19,447 دونمًا: 3,902 دونم بساتين وأراضٍ مروية، و11,219 دونمًا حبوب، و36 دونمًا مبنية. (السنة فقط موثّقة)', en: 'Its land totalled 19,447 dunums: 3,902 of plantations and irrigable land, 11,219 of cereals and 36 built-up. (Only the year is documented.)' }, sourceId: VILLAGE_STATS_1945 },
        { id: 'ev-burqin-7', year: '1967', title: { ar: 'الاحتلال الإسرائيلي', en: 'Israeli occupation' }, description: { ar: 'وقعت البلدة تحت الاحتلال الإسرائيلي بعد حرب 1967. (السنة فقط موثّقة)', en: 'The town came under Israeli occupation after the 1967 war. (Only the year is documented.)' }, sourceId: WIKI_BURQIN },
        { id: 'ev-burqin-8', year: '2015', date: '2015-07-21', title: { ar: 'استشهاد محمد أحمد علاونة', en: 'Mohammed Ahmed Alauna killed' }, description: { ar: 'استُشهد الشاب محمد أحمد علاونة (21 عامًا) برصاص القوات الإسرائيلية خلال مواجهة في أثناء حملة اعتقال ليلية في البلدة.', en: 'Mohammed Ahmed Alauna, 21, was shot dead by Israeli forces during a confrontation on a night-time arrest raid in the town.' }, sourceId: WIKI_BURQIN },
      ],
    },
    heritage: [
      { id: 'lm-burqin-1', kind: 'religious', name: { ar: 'كنيسة القديس جاورجيوس (كنيسة برقين)', en: 'Church of St George (Burqin Church)' }, description: { ar: 'كنيسة من العهد البيزنطي للروم الأرثوذكس، توصف بأنها من أقدم الكنائس في العالم، وهي مقصد سياحي تعمل البلدية ووزارة السياحة على تطويره.', en: 'A Byzantine-era Greek Orthodox church, described as one of the oldest churches in the world; the municipality and the Ministry of Tourism are developing it as a tourist site.' }, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Burqin_Church-1.jpg/960px-Burqin_Church-1.jpg', sourceId: WIKI_BURQIN },
      { id: 'lm-burqin-2', kind: 'archaeological', name: { ar: 'الآبار المنقورة والموقع القديم', en: 'Rock-cut cisterns and the ancient site' }, description: { ar: 'نحو 30 بئرًا منقورة أحصاها غيرين، وحجارة قديمة أُعيد استخدامها في بيوت البلدة، وعُثر على فخار من العصر البرونزي المبكر حتى أوائل العهد العثماني.', en: 'About 30 rock-cut cisterns counted by Guérin, old stones reused in the town houses, and pottery from the Early Bronze Age to the early Ottoman period.' }, sourceId: WIKI_BURQIN },
    ],
    culture: [],
    agriculture: {
      crops: [{ ar: 'الزيتون', en: 'Olives', productId: '1', sourceId: SWP }],
      economy: [{ ar: 'السياحة الدينية حول كنيسة القديس جاورجيوس', en: 'Religious tourism around the Church of St George', sourceId: WIKI_BURQIN }],
    },
    facilities: [{ id: 'fa-burqin-1', kind: 'church', name: { ar: 'كنيسة القديس جاورجيوس', en: 'Church of St George' }, count: 1, sourceId: WIKI_BURQIN }],
    population: [
      { id: 'pop-burqin-1863', year: 1863, population: 1000, kind: 'estimate', sourceId: WIKI_BURQIN, note: 'About 1,000, per Victor Guérin (1875).' },
      { id: 'pop-burqin-1922', year: 1922, population: 883, kind: 'census', sourceId: BARRON_1923, note: '871 Muslims, 12 Christians.' },
      { id: 'pop-burqin-1931', year: 1931, population: 1086, kind: 'census', sourceId: MILLS_1932, note: '1,010 Muslims, 76 Christians, in 227 inhabited houses.' },
      { id: 'pop-burqin-1945', year: 1945, population: 1540, kind: 'estimate', sourceId: VILLAGE_STATS_1945, note: '1,430 Muslims, 110 Christians.' },
      { id: 'pop-burqin-1961', year: 1961, population: 2055, kind: 'census', sourceId: JORDAN_1961 },
      { id: 'pop-burqin-1967', year: 1967, population: 2036, kind: 'census', sourceId: PERLMANN_1967, note: '415 of them came from Israeli territory.' },
      { id: 'pop-burqin-2007', year: 2007, population: 5685, kind: 'census', sourceId: PCBS_2007 },
      { id: 'pop-burqin-2017', year: 2017, population: 7126, kind: 'census', sourceId: PCBS_2017 },
    ],
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Burqin_Church-1.jpg/960px-Burqin_Church-1.jpg',
    coverCaption: 'كنيسة القديس جاورجيوس في برقين (Sylwia Ufnalska, CC BY-SA 4.0, Wikimedia Commons)',
  },
  'beit-ummar': {
    name: { ar: 'بيت أمّر', en: 'Beit Ummar' },
    altSpellings: ['Bayt Ummar', 'Beit Omar'],
    historicalNames: [
      { name: { ar: 'بيت عمرة', en: "Beit 'Amra" }, period: '', kind: 'historical', meaning: 'An early name of the village (Grossman 1986).', sourceId: WIKI_BEIT_UMMAR },
      { name: { ar: 'كفّين الفوقا', en: 'Kuffin al-Fauqa' }, period: '', kind: 'historical', meaning: 'Upper Kuffin (Grossman 1986).', sourceId: WIKI_BEIT_UMMAR },
    ],
    governorateId: 'hebron',
    adminArea: { ar: 'محافظة الخليل', en: 'Hebron Governorate' },
    description: {
      ar: 'بلدة فلسطينية على بُعد نحو 11 كم شمال غرب الخليل، في محافظة الخليل. بلغ عدد سكانها 16,977 نسمة عام 2017 وفق الجهاز المركزي للإحصاء الفلسطيني. أغلب اقتصادها زراعي وتشتهر بكروم العنب، وصودرت آلاف الدونمات من أراضيها لصالح المستوطنات والطرق الالتفافية.',
      en: 'A Palestinian town about 11 km northwest of Hebron, in Hebron Governorate. Its population was 16,977 in 2017, according to the Palestinian Central Bureau of Statistics. Its economy is mostly agricultural and it is known for its grape vines; thousands of dunums of its land have been confiscated for settlements and bypass roads.',
    },
    coordinates: { lat: 31.62139, lng: 35.10222 },
    nearby: [],
    history: {
      overview: {
        ar: 'يُعتقد أنها موقع قرية معاراث التوراتية. بنى فيها السلطان الأيوبي المعظّم مسجدًا بمئذنة عام 1226، وأضاف إليه المماليك. وصفها مسح فلسطين الغربية عام 1883 قرية صغيرة بارزة على خط تقسيم المياه. خضعت للحكم الأردني بعد 1948، وتقع تحت الاحتلال الإسرائيلي منذ 1967، وصارت بلدية عام 1997.',
        en: 'Believed to be the site of the biblical village of Maarath. The Ayyubid sultan al-Mu\'azzam built a mosque with a minaret there in 1226, and the Mamluks added to it. The Survey of Western Palestine (1883) described a small but conspicuous village on the watershed. It came under Jordanian rule after 1948, has been under Israeli occupation since 1967, and became a municipality in 1997.',
      },
      nameOrigin: { ar: '«بيت أمّر»، بحسب بالمر (1881). وتقول رواية محلية إنها سُمّيت باسم الخليفة عمر بن الخطاب.', en: '"House of Ummar", according to Palmer (1881). A local tradition says it was named after the caliph Umar ibn al-Khattab.' },
      events: [
        { id: 'ev-beitummar-1', year: '1226', title: { ar: 'بناء المسجد الأيوبي', en: 'Ayyubid mosque built' }, description: { ar: 'بنى السلطان الأيوبي المعظّم مسجدًا بمئذنة بإشراف والي القدس رشيد الدين المعظّمي، وأضاف إليه المماليك لاحقًا ونقشوا عليه. (السنة فقط موثّقة)', en: "The Ayyubid sultan al-Mu'azzam built a mosque with a minaret, supervised by the governor of Jerusalem Rashid ad-Din al-Mu'azzami; the Mamluks later added to it and carved inscriptions. (Only the year is documented.)" }, sourceId: WIKI_BEIT_UMMAR },
        { id: 'ev-beitummar-2', year: '1863', title: { ar: 'زيارة فكتور غيرين', en: "Victor Guérin's visit" }, description: { ar: 'قدّر عدد سكانها بنحو 450 نسمة. (السنة فقط موثّقة)', en: 'He estimated about 450 inhabitants. (Only the year is documented.)' }, sourceId: WIKI_BEIT_UMMAR },
        { id: 'ev-beitummar-3', year: '1883', title: { ar: 'وصفها في مسح فلسطين الغربية', en: 'Described in the Survey of Western Palestine' }, description: { ar: 'قرية صغيرة بارزة على خط تقسيم المياه، وعلى بُعد نصف ميل شمالها الشرقي نبع جيد هو عين كفّين. (السنة فقط موثّقة)', en: "A small but conspicuous village on the watershed, with a good spring, 'Ain Kufin, half a mile to the north-east. (Only the year is documented.)" }, sourceId: SWP },
        { id: 'ev-beitummar-4', year: '1945', title: { ar: 'إحصاءات القرى', en: 'Village Statistics' }, description: { ar: 'بلغت مساحة أراضيها 30,129 دونمًا: 2,912 دونمًا بساتين وأراضٍ مروية، و12,879 دونمًا حبوب، و55 دونمًا مبنية. (السنة فقط موثّقة)', en: 'Its land totalled 30,129 dunums: 2,912 of plantations and irrigable land, 12,879 of cereals and 55 built-up. (Only the year is documented.)' }, sourceId: VILLAGE_STATS_1945 },
        { id: 'ev-beitummar-5', year: '1950', title: { ar: 'ضمّها إلى الأردن', en: 'Annexed by Jordan' }, description: { ar: 'بعد حرب 1948 واتفاقيات الهدنة عام 1949 خضعت للحكم الأردني، وضُمّت إلى الأردن عام 1950. (السنة فقط موثّقة)', en: 'After the 1948 war and the 1949 Armistice Agreements it came under Jordanian rule, and was annexed by Jordan in 1950. (Only the year is documented.)' }, sourceId: WIKI_BEIT_UMMAR },
        { id: 'ev-beitummar-6', year: '1967', title: { ar: 'الاحتلال الإسرائيلي', en: 'Israeli occupation' }, description: { ar: 'وقعت البلدة تحت الاحتلال الإسرائيلي بعد حرب 1967. (السنة فقط موثّقة)', en: 'The town came under Israeli occupation after the 1967 war. (Only the year is documented.)' }, sourceId: WIKI_BEIT_UMMAR },
        { id: 'ev-beitummar-7', year: '1997', date: '1997-04-17', title: { ar: 'تأسيس البلدية', en: 'Municipality founded' }, description: { ar: 'صارت بلدية بعد حلّ المجلس القروي الذي عيّنته إسرائيل، وعيّنت السلطة الوطنية الفلسطينية حسين بدر رئيسًا لها.', en: 'It became a municipality after the Israeli-appointed village council was dissolved, and the Palestinian National Authority appointed Hussein Badr.' }, sourceId: WIKI_BEIT_UMMAR },
        { id: 'ev-beitummar-8', year: '2014', title: { ar: 'استشهاد ثلاثة شبان في يوم واحد', en: 'Three young men killed in one day' }, description: { ar: 'استُشهد عبد الحميد بريغيث وسلطان زقيق وهاشم أبو ماريا برصاص قنّاص إسرائيلي خلال مظاهرة في آب 2014.', en: 'Abdul Hamid Bregeith, Sultan Zaqiq and Hashem Abu Maria were killed by an Israeli sharpshooter during a protest in August 2014.' }, sourceId: WIKI_BEIT_UMMAR },
      ],
    },
    heritage: [
      { id: 'lm-beitummar-1', kind: 'religious', name: { ar: 'مسجد النبي متّى', en: 'Mosque of Nabi Matta' }, description: { ar: 'المسجد الرئيسي في البلدة، ويضم قبر النبي متّى الذي يُطابَق مع أمتّاي والد النبي يونس. بُني مسجد بمئذنة عام 1226 في العهد الأيوبي.', en: 'The town\'s main mosque, housing the tomb of Nabi Matta, identified with Amittai, father of Jonah. A mosque with a minaret was built here in 1226 under the Ayyubids.' }, sourceId: WIKI_BEIT_UMMAR },
      { id: 'lm-beitummar-2', kind: 'archaeological', name: { ar: 'كنيسة خربة عسيدة', en: 'Khirbat Asida church' }, description: { ar: 'كنيسة يُرجَّح أنها من القرن الخامس الميلادي، وعُدّلت على الأرجح في القرن الثامن، كُشف عنها في ثلاثينيات القرن العشرين شرق وسط البلدة.', en: 'A church tentatively dated to the 5th century CE, probably altered in the 8th, excavated in the 1930s east of the town centre.' }, sourceId: WIKI_BEIT_UMMAR },
      { id: 'lm-beitummar-3', kind: 'natural', name: { ar: 'عين كفّين', en: "'Ain Kufin" }, description: { ar: 'نبع جيد على بُعد نصف ميل شمال شرق القرية.', en: 'A good spring half a mile north-east of the village.' }, sourceId: SWP },
    ],
    culture: [
      { id: 'cp-beitummar-1', category: 'food', title: { ar: 'ورق العنب والدبس', en: "Stuffed grape leaves and grape syrup" }, description: { ar: 'من كروم البلدة يُصنع ورق العنب المحشي (ورق العنب) ودبس العنب.', en: "The town's vines give waraq al-'inib (stuffed grape leaves) and dibs (grape syrup)." }, sourceId: WIKI_BEIT_UMMAR },
    ],
    agriculture: {
      crops: [
        { ar: 'العنب', en: 'Grapes', productId: '2', sourceId: WIKI_BEIT_UMMAR },
        { ar: 'الكرز', en: 'Cherries', sourceId: WIKI_BEIT_UMMAR },
        { ar: 'البرقوق', en: 'Plums', sourceId: WIKI_BEIT_UMMAR },
        { ar: 'التفاح', en: 'Apples', sourceId: WIKI_BEIT_UMMAR },
        { ar: 'الزيتون', en: 'Olives', productId: '1', sourceId: WIKI_BEIT_UMMAR },
      ],
      economy: [{ ar: 'الزراعة، وخاصة كروم العنب', en: 'Agriculture, especially grape vines', sourceId: WIKI_BEIT_UMMAR }],
    },
    facilities: [{ id: 'fa-beitummar-1', kind: 'mosque', name: { ar: 'مسجد النبي متّى', en: 'Mosque of Nabi Matta' }, count: 1, sourceId: WIKI_BEIT_UMMAR }],
    population: [
      { id: 'pop-beitummar-1863', year: 1863, population: 450, kind: 'estimate', sourceId: WIKI_BEIT_UMMAR, note: 'About 450, per Victor Guérin (1869).' },
      { id: 'pop-beitummar-1922', year: 1922, population: 829, kind: 'census', sourceId: BARRON_1923, note: 'All Muslims.' },
      { id: 'pop-beitummar-1931', year: 1931, population: 1135, kind: 'census', sourceId: MILLS_1932, note: 'All Muslims, in 217 inhabited houses.' },
      { id: 'pop-beitummar-1945', year: 1945, population: 1680, kind: 'estimate', sourceId: VILLAGE_STATS_1945, note: '1,600 Muslims and 80 Jews.' },
      { id: 'pop-beitummar-1961', year: 1961, population: 2103, kind: 'census', sourceId: JORDAN_1961 },
      { id: 'pop-beitummar-1967', year: 1967, population: 2630, kind: 'census', sourceId: PERLMANN_1967 },
      { id: 'pop-beitummar-2017', year: 2017, population: 16977, kind: 'census', sourceId: PCBS_2017 },
    ],
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/BeitUmmar.JPG/1280px-BeitUmmar.JPG',
    coverCaption: 'بيت أمّر عام 2011 (Palobserver, CC0, Wikimedia Commons)',
  },
}

// Complete each village document as the import does.
const docs = Object.entries(villages).map(([id, v]) => {
  const cited = new Set<string>([COMMONS])
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(walk)
    else if (x && typeof x === 'object') for (const [k, val] of Object.entries(x)) k === 'sourceId' && typeof val === 'string' ? cited.add(val) : walk(val)
  }
  walk(v)
  const description = v.description as { ar: string; en: string }
  return [
    id,
    {
      ...v,
      summary: description,
      art: art(id),
      featured: false,
      status: 'published',
      verification: 'pending',
      reviewHistory: [],
      sourceIds: [...cited].sort((a, b) => Number(a) - Number(b)),
      createdAt: at,
      updatedAt: at,
      createdBy: 'import',
      updatedBy: 'import',
      lastAuditId: `import-villages-${id}`,
    },
  ] as const
})
for (const [id, s] of Object.entries(newSources)) {
  s.villageIds = docs.filter(([, d]) => (d.sourceIds as string[]).includes(id)).map(([v]) => v)
  s.verification = 'pending'
  s.updatedAt = at
  s.lastAuditId = `import-sources-${id}`
}

if (dryRun) {
  for (const [id, d] of docs) {
    const h = d.history as { events: unknown[] }
    console.log(`${id}: ${(d.population as unknown[]).length} population, ${h.events.length} events, ${(d.heritage as unknown[]).length} landmarks, sources ${(d.sourceIds as string[]).join(',')}`)
  }
  console.log('new sources:', Object.entries(newSources).map(([id, s]) => `${id} ${s.title} → ${(s.villageIds as string[]).join(',')}`).join('\n  '))
  process.exit(0)
}

const keyPath = process.env.FIREBASE_KEY ?? join(homedir(), 'Desktop', 'firebase-key.json')
if (!existsSync(keyPath) || (JSON.parse(readFileSync(keyPath, 'utf8')) as { project_id?: string }).project_id !== PROJECT_ID) {
  console.error(`No service-account key for ${PROJECT_ID} at ${keyPath}.`)
  process.exit(1)
}
const { cert, initializeApp } = await import('firebase-admin/app')
const { FieldValue, getFirestore } = await import('firebase-admin/firestore')
initializeApp({ credential: cert(keyPath), projectId: PROJECT_ID })
const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

for (const [id] of docs) {
  if ((await db.doc(`villages/${id}`).get()).exists) {
    console.error(`villages/${id} already exists. Nothing was written.`)
    process.exit(1)
  }
}
for (const id of Object.keys(newSources)) {
  if ((await db.doc(`sources/${id}`).get()).exists) {
    console.error(`sources/${id} already exists. Nothing was written.`)
    process.exit(1)
  }
}

const batch = db.batch()
const audit = (target: string, entityType: string, entityLabel: string) => ({
  userId: 'import', userName: 'Seed import', action: 'create', entityType, entityLabel, target, at, createdAt: FieldValue.serverTimestamp(), details: 'Added by scripts/add-villages-2026-11.ts', ip: '—',
})
const review = (target: string, villageId: string, kind: string, summary: { ar: string; en: string }) => ({
  target, villageId, kind, submittedBy: 'import', submittedByName: 'Seed import', submittedAt: at, status: 'pending', summary, changes: [],
  history: [{ at, by: 'import', action: 'submitted', note: 'Added from sourced research; not reviewed yet.' }], payload: null,
})
for (const [id, s] of Object.entries(newSources)) {
  batch.set(db.doc(`sources/${id}`), s)
  batch.set(db.doc(`auditLogs/import-sources-${id}`), audit(`sources/${id}`, 'source', s.title as string))
  batch.set(db.doc(`submissions/seed-sources-${id}`), review(`sources/${id}`, (s.villageIds as string[])[0] ?? '', 'source', { en: `Source: ${s.title}`, ar: `مصدر: ${s.title}` }))
}
for (const [id, d] of docs) {
  const name = d.name as { ar: string; en: string }
  batch.set(db.doc(`villages/${id}`), d)
  batch.set(db.doc(`auditLogs/import-villages-${id}`), audit(`villages/${id}`, 'village', name.en))
  batch.set(db.doc(`submissions/seed-villages-${id}`), review(`villages/${id}`, id, 'new-village', { en: `New village: ${name.en}`, ar: `قرية جديدة: ${name.ar}` }))
}
await batch.commit()
const total = (await db.collection('villages').get()).size
console.log(`Added ${docs.map(([id]) => id).join(' and ')} with ${Object.keys(newSources).length} new sources. Villages in Firestore: ${total}.`)
