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
    -- user_id (type: number)
    -- question (type: longtext)
  User data: 
    -- id (type: autonumber)
    -- user_id (type: number)
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

function cleanUserStage(chat) {
  EnrollingNow = EnrollingNow.filter(el => el !== chat)
  QuestioningNow = QuestioningNow.filter(el => el !== chat)
}

const MessageReplys = new Map()

MessageReplys.set(ChatStates.Greetings, {        
text: `
Здравствуйте [Елена]!

Я ваш личный бот-помощник. Готов ответить на все вопросы возникшие по курсу TikTok для бизнеса.

Помимо этого я поделюсь с вами полезной информацией про продвижение и создание контента в TikTok, которую подготовили эксперты курса, в общем, со мной будет не только полезно, но и интересно!

Переходите по кнопке внизу, чтобы скачать полную программу курса и узнать полезную информацию
__________________
Не видите кнопку? пишите любое сообщение в ответ.
`,
  buttons: [
    [{ text: ChatStates.DownloadProgram, }],
    [{ text: ChatStates.Question }],
    [{ text: ChatStates.Enroll, }],
  ]
})

MessageReplys.set(ChatStates.DownloadProgram, {        
text: `
PDF-файл с программой курса.
(информация о преимуществах курса)

Спикеры курса подготовили для вас бесплатный чек-лист “Как создавать продающий контент в TikTok”

Переходите по кнопке ниже, чтобы получить бесплатный чек-лист
`,
  buttons: [
    [{ text: ChatStates.GetChecklist, }],
    [{ text: ChatStates.Enroll, }],
  ]
})

MessageReplys.set(ChatStates.Question, {        
text: `
Отлично, напишите свой вопрос в чате и в ближайшее время я вам отвечу.
`,
  buttons: [
    [{ text: ChatStates.DownloadProgram, }],
    [{ text: ChatStates.Enroll, }],
  ]
})

MessageReplys.set(ChatStates.Enroll, {        
text: `
Рады приветствовать вас на курсе TikTok для бизнеса!
Пожалуйста напишите в чате выбранный ФИО, выбранный тариф и номер для связи, в ближайшее время с вами свяжется эксперт.
`,
  buttons: [
    [{ text: ChatStates.DownloadProgram, }],
  ]
})

MessageReplys.set(ChatStates.GetChecklist, {        
text: `
PDF-файл Чек-лист “Как создавать продающий контент в TikTok”

Спикеры курса, блогеры-миллионники и профессиональные маркетологи, подготовили специальный чек-лист, который поможет вам создавать профессиональный контент в TikTok.
(Подробная информация о спикерах)
  `,
    buttons: [
      [{ text: ChatStates.Enroll }, { text: ChatStates.Question  } ],
    ]
})

// 1 Здравствуйте { скачать программу курса, задать вопрос, записаться на курс }
// 2 Скачать программу курса { получить бесплытный чек-лист, записаться на курс }
// 3 Задать вопрос { скачать программу курса, записаться на курс }
// 4 Записаться на курс { скачать программу курса }
// 5 Получить чеклист { задать вопрос, записаться на курс }

bot.on("polling_error", (err) => console.log(err));

bot.onText(/\/start/, function (msg, match) {
  GreetingsReply(msg)   
});

try {
  bot.sendMessage(ADMIN_ID, 'Бот работает')
} catch (err) {
  console.log(err)
}

bot.on('message', msg => {
  let answer = msg.text
  let chat = GetChat(msg)
  switch (answer) {
    case 'start': // 1 Здравствуйте { скачать программу курса, задать вопрос, записаться на курс }
      GreetingsReply(msg)
      cleanUserStage(chat)
      break;
    case ChatStates.DownloadProgram: // 2 Скачать программу курса { получить бесплытный чек-лист, записаться на курс }
      DownloadProgramReply(msg)
      cleanUserStage(chat)
      break;
    case ChatStates.Question: // 3 Задать вопрос { скачать программу курса, записаться на курс }
      QuestionsReply(msg)
      cleanUserStage(chat)
      
      if (QuestioningNow.indexOf(chat) === -1) //На всякий случай проверяем что он уже не находится в чате
        QuestioningNow.push(chat)
      break;
    case ChatStates.Enroll: // 4 Записаться на курс { скачать программу курса }
      EnrollReply(msg)

      cleanUserStage(chat)
      
      if (EnrollingNow.indexOf(chat) === -1) //На всякий случай проверяем что он уже не находится в чате
        EnrollingNow.push(chat)
      break;
    case ChatStates.GetChecklist: // 5 Получить чеклист { задать вопрос, записаться на курс }
      GetChecklistReply(msg)
      cleanUserStage(chat)
      break;
    default:
      if (EnrollingNow.indexOf(chat) !== -1) {
        //Берем данные и кладем в БД
        UploadToAirtable(chat, answer, AirtableDataTypes.Data)
        DownloadProgramReply(msg)
      }
      if (QuestioningNow.indexOf(chat) !== -1) {
        //Если вопрос то кладем в таблицу вопросов
        UploadToAirtable(chat, answer, AirtableDataTypes.Question)
      }
      cleanUserStage(chat)
      break;
  }
});


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
    };
    let chat = GetChat(msg);
    bot.sendMessage(chat, arr.text, options)
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
  };
  let chat = GetChat(msg);
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
  };
  let chat = GetChat(msg);
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
  };
  let chat = GetChat(msg);
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
  };
  let chat = GetChat(msg);
  bot.sendMessage(chat, arr.text, options)
}

/////////////////
function UploadToAirtable(userId, message, type) {
  if (type === AirtableDataTypes.Question) {
    base('Questions').create([{
      fields: {
        user_id: userId,
        question: message
      }  
    }], function(err, records) {
      if (err) {
        console.error(err);
        return;
      }
    })
  }

  if (type === AirtableDataTypes.Data) {
    base('User data').create([{
      fields: {
        user_id: userId,
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
    return chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id
}
