import express from "express";
import bcrypt from "bcryptjs";
import User from "../../models/schemas/User";
import {
  jwtRequired,
} from "../../../src/middleware/authentication";
import { validateString } from "../../../../shared/utils";
import { ERROR_CODES, SUCCESS_CODES } from "../../../../shared/status-messages";
import UserGroup from "../../../src/models/schemas/UserGroup";
import {
  emailExists,
  getRemoteUrl,
} from "../../lib/utils";
import { sendEmailWithTemplate } from "../../lib/email-service";

const router = express.Router();

/**
 * Methode zum Registrieren eines neuen Haupt-Benutzers
 */
router.post("/newUser", async (req: any, res: any) => {
  const {
    userAccountData: {
      email: accountEmail = undefined,
      password = undefined,
    } = undefined,
    userProfileData = undefined,
    userGroupData = undefined,
  } = req.body || {};

  let identifier = validateString(accountEmail);
  let secret = validateString(password);

  if (!identifier || !secret) {
    res.status(ERROR_CODES.ERROR_HTTP_CODE).json(ERROR_CODES.INVALID_INPUT);
    return;
  }
  if (await emailExists(identifier)) {
    res.status(ERROR_CODES.ERROR_HTTP_CODE).json(ERROR_CODES.EMAIL_TAKEN);
    return;
  }
  identifier = identifier.toLowerCase();

  const userGroup = new UserGroup(userGroupData);
  userGroup.save();

  const user = new User({
    email: identifier,
    secretHash: await bcrypt.hash(secret, 10),
    loginFailCounter: 0,
    registrationDate: new Date(),
    ofUserGroup: userGroup._id,
    employee: { departmentRole: "owner" },
  });
  if (userProfileData) {
    user.address = {
      country: userProfileData.country ?? "",
      city: userProfileData.city ?? "",
      postcode: userProfileData.postcode ?? "",
      street: userProfileData.street ?? "",
      houseNumber: userProfileData.houseNumber ?? "",
    };
    user.salutation = userProfileData.salutation ?? "";
    user.firstName = userProfileData.firstName ?? "";
    user.lastName = userProfileData.lastName ?? "";
    user.phone = userProfileData.phone ?? "";
  }
  await user.save();

  res.status(SUCCESS_CODES.SUCCESS_HTTP_CODE).json(SUCCESS_CODES.REGISTERED);
});

/**
 * Methode zum Einladen eines Mitarbeiters zur Registrierung im System
 */
router.post(
  "/employee/invite/",
  jwtRequired,
  async (req: any, res: any) => {
    let { id = undefined } = req.body || {};
    let authUser = req.user;
    if (!id || !authUser) {
      res.status(404).json({});
      return;
    }
    let user = await User.findOne({
      _id: id,
      ofUserGroup: authUser.ofUserGroup,
    }).select("+secretHash +email");
    if (!user || validateString(user.secretHash) != null) {
      res.status(404).json({});
      return;
    }
    if (user.employeeRegistration) {
      if (user.employeeRegistration.expireDate) {
        const tokenExpiry = new Date(user.employeeRegistration.expireDate);
        const now = new Date();
        if (now < tokenExpiry) {
          // still 'pending' user
          res.status(404).json({});
          return;
        }
      }
    }
    let availableToken = "";
    for (let tokenCounter = 0; tokenCounter < 5; tokenCounter++) {
      const tokenLength = 8 + tokenCounter;
      const hexChars = "0123456789abcdefABCDEF";
      let tryToken = "";
      for (let i = 0; i < tokenLength; i++) {
        tryToken += hexChars[Math.floor(Math.random() * hexChars.length)];
      }
      const found_user = await User.findOne({
        "employeeRegistration.token": tryToken,
      });
      if (!found_user) {
        availableToken = tryToken;
        break;
      }
    }
    if (availableToken.length > 0) {
      let tokenExpiry = new Date();
      tokenExpiry.setTime(tokenExpiry.getTime() + 3 * 60 * 60 * 1000);
      user.employeeRegistration = {
        token: availableToken,
        expireDate: tokenExpiry,
      };
      let link =
        getRemoteUrl() + "register/employee/" + id + "/" + availableToken;
      if (
        await sendEmailWithTemplate(
          "[CraftERP] Einladung",
          user.email,
          "REGISTER_EMPLOYEE_MAIL",
          { link: link }
        )
      ) {
        user.save();
        res.status(200).json({});
        return;
      }
    }
    res.status(404).json({});
    return;
  }
);

/**
 * Methode zum Abrufen der Registrierungsdaten eines Mitarbeiters über einen Registrierungslink (userId, token)
 */
router.get("/employee/", async (req: any, res: any) => {
  const userId = validateString(req.query.userId);
  const token = validateString(req.query.token);

  if (!userId || !token) {
    return res.status(404).json({});
  }

  try {
    const user = await User.findById(userId).select("+email +secretHash");

    if (!user || !user.employeeRegistration || user.secretHash) {
      return res.status(404).json({});
    }

    if (user.employeeRegistration.token !== token) {
      return res
        .status(ERROR_CODES.ERROR_HTTP_CODE)
        .json(ERROR_CODES.WRONG_EMPLOYEE_REGISTER_TOKEN);
    }

    const now = new Date();
    const expireDate = user.employeeRegistration.expireDate;
    if (!expireDate) {
      return res.status(404).json({});
    }
    const tokenExpiry = new Date(expireDate);
    if (now >= tokenExpiry) {
      return res
        .status(ERROR_CODES.ERROR_HTTP_CODE)
        .json(ERROR_CODES.EXPIRED_EMPLOYEE_REGISTER_TOKEN);
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(404).json({});
  }
});

/**
 * Methode zum Abschließen der Registrierung eines Mitarbeiters
 */
router.post("/employee/update/", async (req: any, res: any) => {
  let {
    password = undefined,
    email = undefined,
    firstName = undefined,
    lastName = undefined,
    phone = undefined,
  } = req.body || {};
  let { userId = undefined, token = undefined } = req.query || {};
  let secret = validateString(password);
  token = validateString(token);
  email = validateString(email) ? validateString(email)?.toLowerCase() : null;

  if (!token || !secret || !email || !userId) {
    return res.status(404).json();
  }

  try {
    let user = await User.findById(userId).select("+email +secretHash");

    if (!user || user.secretHash) {
      // already registered or not found
      return res.status(404).json({});
    }

    if (
      !user.employeeRegistration ||
      user.employeeRegistration.token !== token
    ) {
      return res
        .status(ERROR_CODES.ERROR_HTTP_CODE)
        .json(ERROR_CODES.WRONG_EMPLOYEE_REGISTER_TOKEN);
    }

    let now = new Date();
    if (
      !user.employeeRegistration.expireDate ||
      now >= user.employeeRegistration.expireDate
    ) {
      return res
        .status(ERROR_CODES.ERROR_HTTP_CODE)
        .json(ERROR_CODES.EXPIRED_EMPLOYEE_REGISTER_TOKEN);
    }
    if (
      user.email == undefined ||
      user.email.toLowerCase() != email.toLowerCase()
    ) {
      if (await emailExists(email)) {
        res.status(ERROR_CODES.ERROR_HTTP_CODE).json(ERROR_CODES.EMAIL_TAKEN);
        return;
      }
      user.email = email.toLowerCase();
    }
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.secretHash = await bcrypt.hash(secret, 10);
    user.registrationDate = new Date();

    // Entferne registrationToken
    user.employeeRegistration = undefined;

    await user.save();

    return res.status(200).json({ succeed: true });
  } catch (error) {
    return res.status(404).json({});
  }
});


export default router;