const express = require('express');
const session = require('express-session');
// const flash = require('req-flash');
const flash = require('simple-flash');

const app = express();
const port = process.env.PORT || 8080;
const fs = require('fs');
const questions = require('./data/questions.json');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const axios = require('axios');
const FormData = require('form-data');
const util = require('util');
const questionValidator = require('./validations/questionBoardValidator');
let unLinkFile = util.promisify(fs.unlink);
require('dotenv').config()

//session package
app.use(session({
  cookie: { maxAge: 604800000 },
  resave: false,
  secret: 'keyboard cat'
}))
//flash package
// app.use(flash({locals: 'flash'}))
app.use(flash())

//for the sesion storage
app.use((req, res, next) =>{
  res.locals.formErrors = req.session.formErrors;
  res.locals.formBody = req.session.formBody;
  res.locals.formModalErrorId = req.session.formModalErrorId
  delete req.session.formErrors;
  delete req.session.formBody;
  delete req.session.formModalErrorId;
  next()
});
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.urlencoded({ extended: true }))

//the welcome page
app.get('/',(req,res)=>{
  try {
    const filePath = './data/questions.json';
      const data = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(data);
  } catch (err) {
      console.error('Error reading file:', err);
  }
    res.render('index',{ subjects: existingData.map(item => item.subject) });
})


//gets the topic for each subject to be generated
app.post('/gettopics',(req,res)=>{
  var subject = req.body.subject;
 if (questions.length < 1) {
    return
 }
var unique = new Set()
 for (let question of questions) {
  if (subject === question.subject) {
  unique.add(question.topic)
  }
}
var topics =  Array.from(unique)
res.json(topics)
})

//the questions page where questions are set
app.get('/admin/questions', (req, res) => {  
  let existingData = [];
  try {
    const filePath = './data/questions.json';
      const data = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(data);
  } catch (err) {
      console.error('Error reading file:', err);
  }
  res.render('questions', { questions: existingData});
});


//the route that handles the submit form in the question page
app.post('/admin/questions', upload.single('image'), questionValidator,(req, res) => {

if(req.file){
  let form = new FormData();
  form.append('image', fs.createReadStream(req.file.path), {
      contentType: 'application/octet-stream',
  });
  
  axios.post('https://api.imgbb.com/1/upload', form, {
      headers: {
          ...form.getHeaders(),
      },
      params: {
          'key': process.env.IMGBB_API_KEY,
      }
  })
  .then((response) => {
      console.log(response.data);
      unLinkFile(req.file.path)
      const subject  = req.body.subject;
      const question = req.body.question;
      const topic = req.body.topic;
      const options = Array.isArray(req.body.options) ? req.body.options : [req.body.options];
      const answer = req.body.answer;
      const difficulty = req.body.difficulty;
      let marks;
      switch (difficulty) {
          case 'Easy':
              marks = 5;
              break;
          case 'Medium':
              marks = 10;
              break;
          case 'Hard':
              marks = 15;
              break;
      }
      

        const filePath = './data/questions.json';
          var formData = {id: questions.length + 1, subject,question,topic,options,answer,difficulty, image: response.data.data.url, marks };
      
        let existingData = [];
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(data);
        } catch (err) {
            console.error('Error reading file:', err);
        }
      
        existingData.push(formData);
        
        fs.writeFile(filePath, JSON.stringify(existingData, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                res.status(500).send('Error saving data.');
                return;
            }
            req.flash('success','question added successfully')
            res.redirect('/admin/questions')
        });

  })
  .catch((error) => {
      console.error(error);
  });
}else{

  const subject  = req.body.subject;
  const question = req.body.question;
  const topic = req.body.topic;
  const options = Array.isArray(req.body.options) ? req.body.options : [req.body.options];
  const answer = req.body.answer;
  const difficulty = req.body.difficulty;
  let marks;
  switch (difficulty) {
      case 'Easy':
          marks = 5;
          break;
      case 'Medium':
          marks = 10;
          break;
      case 'Hard':
          marks = 15;
          break;
  }
  
 
    const filePath = './data/questions.json';
      var formData = {id: questions.length + 1, subject,question,topic,options,answer,difficulty, marks };
  
    let existingData = [];
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(data);
    } catch (err) {
        console.error('Error reading file:', err);
    }
  
    existingData.push(formData);
  
    fs.writeFile(filePath, JSON.stringify(existingData, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            res.status(500).send('Error saving data.');
            return;
        }
        req.flash('success','question added successfully')
        res.redirect('/admin/questions')
    });
}
});

// shuffle questions in the generator page
function shuffleQuests(quests) {
  for (let i = quests.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quests[i], quests[j]] = [quests[j], quests[i]];
  }
}

// Generate question paper
app.post('/generate-questions', (req, res) => {
  var subject = req.body.subject;
  const easyMarks = 20;
  const mediumMarks = 50;
  const hardMarks = 30;

  let easyQuestions = [];
  let mediumQuestions = [];
  let hardQuestions = [];

  let easyMarksCount = 0;
  let mediumMarksCount = 0;
  let hardMarksCount = 0;
  shuffleQuests(questions);
  for (let question of questions) {
    if (subject === question.subject && question.topic === req.body.topic) {
      switch (question.difficulty) {
        case 'Easy':
          if (easyMarksCount + question.marks <= easyMarks) {
            easyQuestions.push(question);
            easyMarksCount += question.marks;
          }
          break;
        case 'Medium':
          if (mediumMarksCount + question.marks <= mediumMarks) {
            mediumQuestions.push(question);
            mediumMarksCount += question.marks;
          }
          break;
        case 'Hard':
          if (hardMarksCount + question.marks <= hardMarks) {
            hardQuestions.push(question);
            hardMarksCount += question.marks;
          }
          break;
      }
    }
  }

  res.json([...easyQuestions, ...mediumQuestions, ...hardQuestions]) ;
});


// see all subject questions
app.get('/preview', (req, res) => {
  let existingData = [];
  try {
    const filePath = './data/questions.json';
      const data = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(data);
  } catch (err) {
      console.error('Error reading file:', err);
  }


    res.render('preview', { questions: existingData });
});

//edit a question
app.get('/question/edit/:id', (req, res) => {
  const questionId = req.params.id; 
  let existingData = [];

  try {
      const filePath = './data/questions.json';
      const data = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(data);
  } catch (err) {
      console.error('Error reading file:', err);
  }

  const question = existingData.find(question => question.id === parseInt(questionId));

  res.render('edit', { question }); // Render the edit page with the specific question
});


//route that handles the edit function
app.post('/question/edit/:id',upload.single('image'),questionValidator, (req,res)=>{
  const questionId = parseInt(req.params.id); // Get the ID from request params
  const { subject, question,topic, options, answer, difficulty } = req.body;

  if(req.file){
    let form = new FormData();
    form.append('image', fs.createReadStream(req.file.path), {
        contentType: 'application/octet-stream',
    });
    
    axios.post('https://api.imgbb.com/1/upload', form, {
        headers: {
            ...form.getHeaders(),
        },
        params: {
            'key': process.env.IMGBB_API_KEY,
        }
    })
    .then((response) => {
        console.log(response.data);
        unLinkFile(req.file.path)
       

  let marks;
  switch (difficulty) {
      case 'Easy':
          marks = 5;
          break;
      case 'Medium':
          marks = 10;
          break;
      case 'Hard':
          marks = 15;
          break;
  }
  const file = `./data/questions.json`
  fs.readFile(`${file}`, 'utf8', (err, data) => {
      if (err) {

          res.status(500).send('Error reading file');
          return;
      }

      let questions = JSON.parse(data);
      const questionIndex = questions.findIndex(question => question.id === questionId);
      if (questionIndex === -1) {
             req.flash('danger','Question not found')
           res.redirect('back')
          return;
      }

      questions[questionIndex] = {
          id: questionId,
          subject,
          question,
          topic,
          options,
          answer,
          difficulty,
          marks,
      };

      fs.writeFile('./data/questions.json', JSON.stringify(questions, null, 2), 'utf8', (err) => {
          if (err) {
              req.flash('danger','error updating ')
              res.redirect('back')
              return;
          }
          req.flash('success','Updated successfully');
          res.redirect('/admin/questions')
      });
  });
     })
    .catch((error) => {
        console.error(error);
    });
  }else{
    let marks;
    switch (difficulty) {
        case 'Easy':
            marks = 5;
            break;
        case 'Medium':
            marks = 10;
            break;
        case 'Hard':
            marks = 15;
            break;
    }
    const file = `./data/questions.json`
    fs.readFile(`${file}`, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
  
        let questions = JSON.parse(data);
        const questionIndex = questions.findIndex(question => question.id === questionId);
        if (questionIndex === -1) {
               req.flash('danger','Question not found')
             res.redirect('back')
            return;
        }
  
        questions[questionIndex] = {
            id: questionId,
            subject,
            question,
            topic,
            options,
            answer,
            difficulty,
            marks,
        };
  
        fs.writeFile('./data/questions.json', JSON.stringify(questions, null, 2), 'utf8', (err) => {
            if (err) {
                req.flash('danger','error updating ')
                res.redirect('back')
                return;
            }
            req.flash('success','Updated successfully');
            res.redirect('/admin/questions')
        });
    });
  }
})





//deletes a question
app.get('/question/delete/:id', (req, res) => {
  const questionId = parseInt(req.params.id);

  fs.readFile('./data/questions.json', 'utf8', (err, data) => {
      if (err) {
          res.status(500).send('Error reading file');
          return;
      }

      let questions = JSON.parse(data);
      const questionIndex = questions.findIndex(question => question.id === questionId);

      if (questionIndex === -1) {
          res.status(404).send('Question not found');
          return;
      }

      questions.splice(questionIndex, 1);
      fs.writeFile('./data/questions.json', JSON.stringify(questions, null, 2), 'utf8', (err) => {
          if (err) {
              console.error('Error writing file:', err);
              res.status(500).send('Error writing file');
              return;
          }
          req.flash('success','Deleted successfully');
          res.redirect('/questions')
      });
  });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




