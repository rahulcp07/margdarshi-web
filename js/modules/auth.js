function bindLoginEvents() {
  const form = document.querySelector("#login-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = document.querySelector("#login-button");
    const error = document.querySelector("#login-error");
    setButtonLoading(button, true, "Signing in...");
    error.textContent = "";
    try {
      state.session = await signIn(document.querySelector("#login-email").value.trim(), document.querySelector("#login-password").value);
      await loadAuthenticatedData();
      location.hash = "#projects";
      renderRegister();
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });
  const signupDialog = document.querySelector("#signup-dialog");
  let verifiedSignupSession = null;
  let verifiedSignupEmail = "";
  document.querySelector("#open-signup").addEventListener("click", () => signupDialog.showModal());
  const closeSignup = (event) => { event.preventDefault(); event.stopPropagation(); signupDialog.close(); };
  document.querySelector("#signup-close-button")?.addEventListener("click", closeSignup);
  document.querySelector("#signup-cancel-button")?.addEventListener("click", closeSignup);

  const setSignupPasswordEnabled = (enabled) => {
    ["#signup-password", "#signup-password-confirm", "#toggle-signup-password", "#toggle-signup-password-confirm", "#signup-button"].forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.disabled = !enabled;
    });
  };

  const resetEmailVerification = () => {
    verifiedSignupSession = null;
    verifiedSignupEmail = "";
    setSignupPasswordEnabled(false);
    document.querySelectorAll(".otp-box").forEach((box) => { box.value = ""; });
    const combinedOtp = document.querySelector("#signup-otp");
    if (combinedOtp) combinedOtp.value = "";
    const status = document.querySelector("#email-verification-status");
    if (status) status.textContent = "Verify your email before creating a password.";
  };
  document.querySelector("#signup-email")?.addEventListener("input", resetEmailVerification);

  const otpBoxes = [...document.querySelectorAll(".otp-box")];
  const syncOtpValue = () => {
    const value = otpBoxes.map((box) => box.value).join("");
    const combined = document.querySelector("#signup-otp");
    if (combined) combined.value = value;
    return value;
  };
  otpBoxes.forEach((box, index) => {
    box.addEventListener("input", (event) => {
      const digit = event.target.value.replace(/\D/g, "").slice(-1);
      event.target.value = digit;
      syncOtpValue();
      if (digit && index < otpBoxes.length - 1) otpBoxes[index + 1].focus();
    });
    box.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
      if (event.key === "ArrowLeft" && index > 0) otpBoxes[index - 1].focus();
      if (event.key === "ArrowRight" && index < otpBoxes.length - 1) otpBoxes[index + 1].focus();
    });
    box.addEventListener("paste", (event) => {
      event.preventDefault();
      const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpBoxes.length);
      if (!digits) return;
      otpBoxes.forEach((item, itemIndex) => { item.value = digits[itemIndex] || ""; });
      syncOtpValue();
      otpBoxes[Math.min(digits.length, otpBoxes.length) - 1].focus();
    });
  });

  const bindPasswordToggle = (buttonId, inputId) => {
    const button = document.querySelector(buttonId);
    const input = document.querySelector(inputId);
    button?.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Show" : "Hide";
      button.setAttribute("aria-pressed", String(!showing));
    });
  };
  bindPasswordToggle("#toggle-signup-password", "#signup-password");
  bindPasswordToggle("#toggle-signup-password-confirm", "#signup-password-confirm");

  document.querySelector("#send-otp-button")?.addEventListener("click", async () => {
    const name = document.querySelector("#signup-name");
    const designation = document.querySelector("#signup-designation");
    const email = document.querySelector("#signup-email");
    const error = document.querySelector("#signup-error");
    [name, designation, email].forEach((field) => field?.setCustomValidity(""));
    if (!name.value.trim() || !designation.value || !email.checkValidity()) {
      if (!name.value.trim()) name.setCustomValidity("Enter your full name.");
      if (!designation.value) designation.setCustomValidity("Select your designation.");
      if (!email.checkValidity()) email.setCustomValidity("Enter a valid email address.");
      document.querySelector("#signup-form").reportValidity();
      return;
    }
    const button = document.querySelector("#send-otp-button");
    setButtonLoading(button, true, "Sending...");
    error.textContent = "";
    resetEmailVerification();
    try {
      await sendEmailOtp({ email: email.value.trim(), fullName: name.value.trim(), designation: designation.value });
      document.querySelector("#otp-section").hidden = false;
      document.querySelector("#email-verification-status").textContent = "A verification code has been sent. Check your inbox and spam folder.";
      otpBoxes[0]?.focus();
      showToast("Verification code sent.");
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });

  document.querySelector("#verify-otp-button")?.addEventListener("click", async () => {
    const email = document.querySelector("#signup-email");
    const otp = document.querySelector("#signup-otp");
    const error = document.querySelector("#signup-error");
    const otpValue = syncOtpValue();
    if (!/^\d{8}$/.test(otpValue)) {
      error.textContent = "Enter all 8 digits of the verification code.";
      const firstEmpty = otpBoxes.find((box) => !box.value);
      (firstEmpty || otpBoxes[0])?.focus();
      return;
    }
    const button = document.querySelector("#verify-otp-button");
    setButtonLoading(button, true, "Verifying...");
    error.textContent = "";
    try {
      const result = await verifyEmailOtp({ email: email.value.trim(), token: otpValue });
      if (!result.access_token) throw new Error("Email verification did not return a valid session.");
      verifiedSignupSession = result;
      verifiedSignupEmail = email.value.trim().toLowerCase();
      email.readOnly = true;
      document.querySelector("#send-otp-button").disabled = true;
      document.querySelector("#otp-section").hidden = true;
      document.querySelector("#email-verification-status").textContent = "Email verified successfully. You may now create your password.";
      setSignupPasswordEnabled(true);
      document.querySelector("#signup-password").focus();
      showToast("Email verified successfully.");
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });

  const clearPasswordValidation = () => {
    document.querySelector("#signup-password")?.setCustomValidity("");
    document.querySelector("#signup-password-confirm")?.setCustomValidity("");
  };
  document.querySelector("#signup-password")?.addEventListener("input", clearPasswordValidation);
  document.querySelector("#signup-password-confirm")?.addEventListener("input", clearPasswordValidation);

  document.querySelector("#signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const email = document.querySelector("#signup-email");
    const password = document.querySelector("#signup-password");
    const confirmPassword = document.querySelector("#signup-password-confirm");
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!verifiedSignupSession || verifiedSignupEmail !== email.value.trim().toLowerCase()) {
      document.querySelector("#signup-error").textContent = "Verify your email before creating the account.";
      return;
    }
    password.setCustomValidity(strongPassword.test(password.value) ? "" : "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.");
    confirmPassword.setCustomValidity(password.value === confirmPassword.value ? "" : "Passwords do not match.");
    if (!formElement.checkValidity()) { formElement.reportValidity(); return; }
    const button = document.querySelector("#signup-button");
    const error = document.querySelector("#signup-error");
    setButtonLoading(button, true, "Creating..."); error.textContent = "";
    try {
      await setVerifiedUserPassword({
        session: verifiedSignupSession,
        password: password.value,
        fullName: document.querySelector("#signup-name").value.trim(),
        designation: document.querySelector("#signup-designation").value,
      });
      state.session = verifiedSignupSession;
      signupDialog.close();
      showToast("Account created and email verified.");
      await loadAuthenticatedData();
      location.hash = "#projects";
      renderRegister();
    } catch (err) { error.textContent = err.message; }
    finally { setButtonLoading(button, false); }
  });
  document.querySelector("#toggle-login-password")?.addEventListener("click", (event) => {
    const input = document.querySelector("#login-password");
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    event.currentTarget.textContent = showing ? "Show" : "Hide";
    event.currentTarget.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  document.querySelector("#preview-button").addEventListener("click", () => { location.href = "./?demo=1#projects"; });
}

async function loadAuthenticatedData() {
  [state.profile, state.projects, state.highways, state.offices, state.directoryEntities] = await Promise.all([getProfile(), getProjects(), getHighways(), getOffices(), getDirectoryEntities()]);
  [state.actionItems, state.assignableUsers, state.projectJurisdictions, state.actionAssignees, state.actionProgressUpdates, state.notificationStates] = await Promise.all([
    getActionItems(), getAssignableUsers(), getProjectJurisdictions(), getActionAssignees(), getActionProgressUpdates(), getNotificationStates()
  ]);
  state.notifications = buildNotifications();
}
