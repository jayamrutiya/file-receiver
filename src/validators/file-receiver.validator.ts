import { checkSchema } from "express-validator";

const fileReceiverValidator = checkSchema({
  file: {
    in: "body",
  },
  tailNumber: {
    in: "body",
    trim: true,
    exists: {
      errorMessage: "Tail number is required.",
    },
    notEmpty: {
      errorMessage: "Tail number cannot be empty.",
    },
  },
});

export default fileReceiverValidator;
