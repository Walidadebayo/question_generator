const { body } = require('express-validator');
const checkForValidationErrors = require('../middlewares/checkForValidationErrors');

let questionValidator = [
    body('subject').notEmpty().withMessage('Subject is required').trim().escape(),
    body('topic').notEmpty().withMessage('Topic is required').trim().escape(),
    body('question').notEmpty().withMessage('Question is required').trim().escape(),
    body('difficulty').notEmpty().withMessage('Difficulty is required').trim().escape(),
    body('options').notEmpty().withMessage('options is required').trim().escape().custom((value, { req }) => {
        if (Array.isArray(value)) {
            if (value.length < 2) {
                value = [];
                throw new Error('Two options is required');
            }
        }
        return true;
    }
    ),
    body('answer').notEmpty().withMessage('Answer is required').trim().escape(),

    checkForValidationErrors,
]
module.exports = questionValidator