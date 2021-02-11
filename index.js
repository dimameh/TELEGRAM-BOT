//==============================================================
//
// НАСТРОЙКИ
//
//==============================================================

const 
{ 
  TOKEN,    // В файле config.json Вставить токен бота

  API_KEY,  // В файле config.json Вставить apiKey из настроек аккаунта airtable 

  BASE_ID,  // В файле config.json Вставить base id базы данных. Найти вот так: Заходите в бд, где можно вкладки с таблицами переключать. 
            //Справа вверху вопросик тык. Api Documentation. "The ID of this base is *********** " 

  ADMIN_ID, // В файле config.json id telegram пользователя БЕЗ КАВЫЧЕК администратора сообщества (для уведомлений о старте работы и тд.)

/*
  В базе, айди которой мы записали в поле BASE_ID, должно быть две таблицы 
  - Questions
  - User data

  Если таких нет, создайте! Вот схемы: 
  (type: ТИП) - ВЫБИРАЕМ ТИП ДАННЫХ ДЛЯ СТОЛБЦА 
  Questions:
    -- id (type: autonumber)
    -- username (type: single line text)
    -- question (type: longtext)
  User data: 
    -- id (type: autonumber)
    -- username (type: single line text)
    -- data (type: longtext)
*/

} = require('./config.json')


//==============================================================
//==============================================================
//==============================================================
//==============================================================
//==============================================================
const TelegramBot = require('node-telegram-bot-api')

const ChatStates = { 
  Greetings: 'Приветствие',
  DownloadProgram: 'Скачать программу курса',
  Question: 'Задать вопрос',
  Enroll: 'Записаться на курс',
  GetChecklist: 'Получить бесплатный чеклист',
}

const AirtableDataTypes = {
  Question: 'question',
  Data: 'data',
}

// Airtable
var Airtable = require('airtable')
var base = new Airtable({apiKey: API_KEY}).base(BASE_ID)

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, {
  polling: true
})
//Люди которые на моменте когда нужно писать свои данные в чат
let EnrollingNow = []
let QuestioningNow = []

function cleanUserStage(username) {
  EnrollingNow = EnrollingNow.filter(el => el !== username)
  QuestioningNow = QuestioningNow.filter(el => el !== username)
}

const MessageReplys = new Map()

MessageReplys.set(ChatStates.Greetings, {        
text: `
🙋🏻‍♂️Здравствуйте %Name%!

Я ваш личный бот-помощник. Готов ответить на все вопросы возникшие по курсу «TikTok для бизнеса».

😏Помимо этого я поделюсь с вами полезной информацией про продвижение и создание контента в TikTok, которую подготовили эксперты курса, в общем, со мной будет не только полезно, но и интересно!

📄Переходите по кнопке внизу, чтобы скачать полную программу курса и узнать полезную информацию 👇🏽
`,
  buttons: [
    [{ text: ChatStates.DownloadProgram, }],
    [{ text: ChatStates.Question }],
    [{ text: ChatStates.Enroll, }],
  ]
})

MessageReplys.set(ChatStates.DownloadProgram, {        
text: `
🔥Преимущества курса «TikTok для бизнеса»:

1️⃣Лучшие эксперты 
Преподаватели курса практикующие эксперты, блогеры, предприниматели и маркетологи, которые ведут TikTok и знаю все фишки продвижения и создания профессионального контента с помощью одного только телефона, а также делают видео с миллионными просмотрами и продюсируют аккаунты в TikTok.😏


2️⃣Блогеры миллионники
На курсе вы познакомитесь с блогерами миллионниками, поработаете под их надзором, получите ценный опыт, который поможет в дальнейшем самостоятельно создавать профессиональный продающий контент в TikTok 🌪


3️⃣«Живое» сопровождение
Во время обучения каждый слушатель будет получать «живую» обратную связь от экспертов по выполненной работе. Помимо этого будут проводиться очные практические работы, во время которых слушатели будут лично работать со своими менторами и выполнять индивидуальные задания по созданию контента и монтажу. 📽

🤩Спикеры курса подготовили для вас бесплатный чек-лист «Как создавать продающий контент в TikTok».

🔥🔥🔥 

Выбирайте кнопку «Получить бесплатный Чек-лист» и забирайте самую сочную информацию про работу в TikTok 🍉
`,
  buttons: [
    [{ text: ChatStates.GetChecklist, }],
    [{ text: ChatStates.Enroll, }],
    [{ text: ChatStates.Question, }],
  ]
})

MessageReplys.set(ChatStates.Question, {        
text: `
Отлично, напишите свой вопрос в чате и в ближайшее время с вами свяжутся❗️

Жду ваш вопрос в чате 😌👇🏽
`,
  buttons: [
    [{ text: ChatStates.DownloadProgram, }],
    [{ text: ChatStates.Enroll, }],
  ]
})

MessageReplys.set(ChatStates.Enroll, {        
text: `
🔥Рады приветствовать вас на курсе «TikTok для бизнеса»!

☺️Пожалуйста напишите в чате свои ФИО, выбранный тариф обучения и предпочитаемый вид связи, в ближайшее время с вами свяжется эксперт для дальнейшей работы 👇🏽
`,
  buttons: [
    [{ text: ChatStates.DownloadProgram, }],
    [{ text: ChatStates.Question, }],
  ]
})

MessageReplys.set(ChatStates.GetChecklist, {        
text: `
🤩Спикеры курса, блогеры-миллионники, профессиональные маркетологи и действующие предприниматели подготовили специальный Чек-лист по работе в TikTok! 

Эти материалы помогут вам создавать профессиональный контент в TikTok и бесплатно привлекать новую аудиторию.

Забирайте отборную информацию про работу в TikTok!

🔥🔥🔥 

Ждём вас на курсе «TikTok для бизнеса». Для регистрации переходите по кнопке «Записаться на курс»!
`,
    buttons: [
      [{ text: ChatStates.Enroll }], 
      [{ text: ChatStates.Question  }],
    ]
})

// 1 Здравствуйте { скачать программу курса, задать вопрос, записаться на курс }
// 2 Скачать программу курса { получить бесплытный чек-лист, записаться на курс }
// 3 Задать вопрос { скачать программу курса, записаться на курс }
// 4 Записаться на курс { скачать программу курса }
// 5 Получить чеклист { задать вопрос, записаться на курс }

bot.on("polling_error", (err) => console.log(err))

bot.onText(/\/start/, function (msg, match) {
  GreetingsReply(msg)   
})

try {
  if (ADMIN_ID !== -1) {
    bot.sendMessage(ADMIN_ID, 'Бот работает')
  }
} catch (err) {
  console.log(err)
}

bot.on('message', msg => {
  let answer = msg.text
  let chat = GetChat(msg)
  let username = '@' + GetUsername(msg)
  switch (answer) {
    case 'start': // 1 Здравствуйте { скачать программу курса, задать вопрос, записаться на курс }
      GreetingsReply(msg)
      cleanUserStage(username)
      break
    case ChatStates.DownloadProgram: // 2 Скачать программу курса { получить бесплытный чек-лист, записаться на курс }
      DownloadProgramReply(msg)
      cleanUserStage(username)
      break
    case ChatStates.Question: // 3 Задать вопрос { скачать программу курса, записаться на курс }
      QuestionsReply(msg)
      cleanUserStage(username)
      
      if (QuestioningNow.indexOf(username) === -1) //На всякий случай проверяем что он уже не находится в чате
        QuestioningNow.push(username)
      break
    case ChatStates.Enroll: // 4 Записаться на курс { скачать программу курса }
      EnrollReply(msg)

      cleanUserStage(username)
      
      if (EnrollingNow.indexOf(username) === -1) //На всякий случай проверяем что он уже не находится в чате
        EnrollingNow.push(username)
      break
    case ChatStates.GetChecklist: // 5 Получить чеклист { задать вопрос, записаться на курс }
      GetChecklistReply(msg)
      cleanUserStage(username)
      break
    default:
      if (EnrollingNow.indexOf(username) !== -1) {
        //Берем данные и кладем в БД
        UploadToAirtable(username, answer, AirtableDataTypes.Data)
        bot.sendMessage(chat, '🙌🏽Спасибо за вашу заявку, в течение суток с вами свяжется эксперт по курсу «TikTok для бизнеса»!')
      }
      if (QuestioningNow.indexOf(username) !== -1) {
        //Если вопрос то кладем в таблицу вопросов
        UploadToAirtable(username, answer, AirtableDataTypes.Question)
        bot.sendMessage(chat, 'Спасибо, в течение суток с вами свяжутся 😉')
      }
      cleanUserStage(username)
      break
  }
})


//Steps with buttons
/////////////////

// 1 Здравствуйте { скачать программу курса, задать вопрос, записаться на курс }
function GreetingsReply(msg) {
    let arr = MessageReplys.get(ChatStates.Greetings)
    let options = {
        reply_markup: JSON.stringify({
          keyboard: arr.buttons,
          resize_keyboard: true,
          one_time_keyboard: true,
        }), 
        parse_mode: 'Markdown'
    }
    let chat = GetChat(msg)
    let text = arr.text.replace('%Name%', msg.hasOwnProperty('chat') ? msg.chat.first_name : msg.from.first_name)
    bot.sendMessage(chat, text, options)
}

// 2 Скачать программу курса { получить бесплытный чек-лист, записаться на курс }
function DownloadProgramReply(msg) {
  let arr = MessageReplys.get(ChatStates.DownloadProgram)
  let options = {
      reply_markup: JSON.stringify({
        keyboard: arr.buttons,
        resize_keyboard: true,
        one_time_keyboard: true,
      }), 
      parse_mode: 'Markdown'
  }
  let chat = GetChat(msg)
  bot.sendDocument(chat, './files/ПРОГРАММА КУРСА.pdf')
  bot.sendMessage(chat, arr.text, options)  
}

// 3 Задать вопрос { скачать программу курса, записаться на курс }
function QuestionsReply(msg) {
  let arr = MessageReplys.get(ChatStates.Question)
  let options = {
      reply_markup: JSON.stringify({
        keyboard: arr.buttons,
        resize_keyboard: true,
        one_time_keyboard: true,
      }), 
      parse_mode: 'Markdown'
  }
  let chat = GetChat(msg)
  bot.sendMessage(chat, arr.text, options)
}

// 4 Записаться на курс { скачать программу курса }
function EnrollReply(msg) {
  let arr = MessageReplys.get(ChatStates.Enroll)
  let options = {
      reply_markup: JSON.stringify({
        keyboard: arr.buttons,
        resize_keyboard: true,
        one_time_keyboard: true,
      }), 
      parse_mode: 'Markdown'
  }
  let chat = GetChat(msg)
  bot.sendMessage(chat, arr.text, options)
}

// 5 Получить чеклист { задать вопрос, записаться на курс }
function GetChecklistReply(msg) {
  let arr = MessageReplys.get(ChatStates.GetChecklist)
  let options = {
      reply_markup: JSON.stringify({
        keyboard: arr.buttons,
        resize_keyboard: true,
        one_time_keyboard: true,
      }), 
      parse_mode: 'Markdown'
  }
  let chat = GetChat(msg)
  bot.sendDocument(chat, './files/Чек-лист.pdf')
  bot.sendMessage(chat, arr.text, options)
}

/////////////////
function UploadToAirtable(username, message, type) {
  if (type === AirtableDataTypes.Question) {
    base('Questions').create([{
      fields: {
        username: username,
        question: message
      }  
    }], function(err, records) {
      if (err) {
        console.error(err)
        return
      }
    })
  }

  if (type === AirtableDataTypes.Data) {
    base('User data').create([{
      fields: {
        username: username,
        data: message
      }  
    }], function(err, records) {
      if (err) {
        console.error(err)
        return
      }
    })
  }
}

function GetChat(msg) {
  return msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id
}

function GetUsername(msg) {
  return msg.hasOwnProperty('chat') ? msg.chat.username : msg.from.username
}