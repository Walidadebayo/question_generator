//display a spinner
function showSpinner() {
    document.getElementById('spinner-overlay').style.display = 'block';
    document.body.style.pointerEvents = 'none';
}

//removes spinner
function hideSpinner() {
    document.getElementById('spinner-overlay').style.display = 'none';
    document.body.style.pointerEvents = 'auto';
}






var questions = [];
function shuffleOpts(opts) {
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }
  
$("#submit").on('click', function () {
    showSpinner();
    $.ajax({
        type: 'post',
        url: '/generate-questions',
        data: {
            subject: $('#subject').val(),
            topic: $('#topic').val(),
        },
        dataType: 'json',
        encode: true,
    }).done(function (data) {
        hideSpinner();
        if (data.length == 0) {
            $('#error').html('No questions found for this subject and difficulty. Please try again.')
            return;
        }
        questions = []
        for (let i = 0; i < data.length; i++) {
            data[i].options = shuffleOpts(data[i].options);
            questions.push(data[i]);
        }
        displayQuestion(questions[currentQuestionIndex]);
        $('#subject-container').hide();
        $('#questions-container').show();
    }).fail(function (data) {
        hideSpinner();
        console.log(data);
    });
});
let currentQuestionIndex = 0;
let score = 0;

//function to display a question
function displayQuestion(question) {
    document.getElementById('questions').innerText = question.question;
    if (question.image) {
        document.getElementById('image').src = question.image;
        $('#image').show();
    }
    document.getElementById('question-number').innerText =  currentQuestionIndex + 1;
    var option1 = document.getElementById('option1');
    var option2 = document.getElementById('option2');
    var option3 = document.getElementById('option3');
    var option4 = document.getElementById('option4');
    option1.value = question.options[0];
    option2.value = question.options[1];
    option3.value = question.options[2];
    option4.value = question.options[3];
    option1.nextElementSibling.innerHTML = question.options[0];
    option2.nextElementSibling.innerHTML = question.options[1];
    option3.nextElementSibling.innerHTML = question.options[2];
    option4.nextElementSibling.innerHTML = question.options[3];
    if (question.options[2] === undefined) {
        option3.style.display = 'none';
        option3.nextElementSibling.style.display = 'none';
        
    }
    if (question.options[3] === undefined) {
        option4.style.display = 'none';
        option4.nextElementSibling.style.display = 'none';
    }

}
var pickedAnswer = []

//check the selected answer
function checkAnswer() {
    const radios = document.getElementsByName('answer');
    for (let i = 0, length = radios.length; i < length; i++) {
        // check if one of the radio buttons is checked
        if (radios[i].checked) {
      if (radios[i].value === questions[currentQuestionIndex].answer) {
        score += questions[currentQuestionIndex].marks;
        pickedAnswer.push(radios[i].value);
      }
      radios[i].checked = false;
      break;
    }
    // else{
    //     pickedAnswer.push('Not Answered');
    // }
  }
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    if (!questions[currentQuestionIndex].image) {
      $('#image').hide();
    }
    displayQuestion(questions[currentQuestionIndex]);
  } else {
    $('#questions-container').hide();
    $('#result-container').show();
    var totalScore = 0;
    for (let i = 0; i < questions.length; i++) {
        totalScore += questions[i].marks;
    }
    document.getElementById('score').innerText = score + '/' + totalScore;
    // display correct answers and answer that was picked
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = question.answer;
      $('#answers').append(`
            <h4 class="mt-5">Question ${i+1} <span id="correct-or-incorrect">${answer === pickedAnswer[i] ? '<i class="bi bi-check2 text-success"></i>' : '<i class="bi bi-x text-danger"></i>'}</span></h4></span></h4>
            <h5>Question: ${question.question}</h5>
            <h6>Correct Answer: ${answer}</h6>
            <h6>Your Answer: ${pickedAnswer[i] == undefined ? "not answered" : pickedAnswer[i]  }</h6>
            
      `);

      $('#restart').on('click', function () {
        location.reload();
      });
    }
  }
}


//generate topics
$('#subject').on('change', function () {
    showSpinner();
    $.ajax({
        type: 'post',
        url: '/gettopics',
        data: {
            subject: $('#subject').val(),
        },
        dataType: 'json',
        encode: true,
    }).done(function (data) {
        hideSpinner();
        $('#topic').html('<option value="" selected disabled>Select Topic</option>');
        for (let i = 0; i < data.length; i++) {
            $('#topic').append(`<option value="${data[i]}">${data[i]}</option>`);
        }
    }).fail(function (data) {
      hideSpinner();
      console.log(data);
    });
});
