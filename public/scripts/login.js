const [formElement] = document.getElementsByTagName("form");
const errorDisplayElement = document.getElementById("error-display");

formElement.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Extract the user Entered email, password and confirm password

  const formData = new FormData(event.target);

  let loginData = Object.fromEntries(formData.entries());

  // Send the same to server for completing registration
  let response;
  try {
    response = await fetch("/login", {
      method: "POST",
      body: JSON.stringify(loginData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log("Failed sending registration data to server");
    console.log(err);
  }

  // If server returns a res w/o an error, redirct to login page

  if (response.ok) {
    open("/home", "_self");
  } else {
    // If servers returns a response with an error, display the error
    // console.log(result);
    let result = await response.json();
    // console.log(result);
    // customAlert(result["error-text"]);
    errorDisplayElement.textContent = result["error-text"];
    errorDisplayElement.style.display = 'block';
  }
});
