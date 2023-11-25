const { validationResult } = require("express-validator");
module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.formErrors = errors.mapped();
        req.session.formModalErrorId = req.body.modal;
        req.session.formBody = req.body;
        console.log(errors)
        return res.redirect('back');
    }
    next();
}