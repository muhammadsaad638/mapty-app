'use strict';

const form = document.querySelector('form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let type;


// const runningList=document.querySelector('.workout--running');
// const runningDistance=runningList.closest('.running-distance');
// const runningDuration=runningList.closest('.running-duration');
// const runningPace=runningList.closest('.running-pace');
// const runningCadence=runningList.closest('.running-cadence');
// console.log(runningDuration);

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks=0;
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _click(){
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //console.log(this.duration);
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

class App {
  #map;
  #mapZoomLevel=13;
  #mapEvent;
  #popUpProp;
  #workouts = [];

  constructor() {
    // Getting the current position
    this._getPosition();
    //console.log(this.#map);

    // Adding event handlers 
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    //console.log('In the constructer');
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

   this._getLocalStorage();
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Some error occured');
      }
    );
  }

  _loadMap(position) {
    const { longitude: lng } = position.coords;
    const { latitude: lat } = position.coords;
    const coords = [lat, lng];
    // Displaying map...
    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this)); // ########

    this.#workouts.forEach(work=>{
      this._renderWorkoutMarker(work);
    })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // Get data from form
    type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    console.log(coords);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    let workout;

    const validInput = (...inputs) => {
      return inputs.every(input => Number.isFinite(input));
    };
    const allPositive = (...inputs) => {
      return inputs.every(input => input > 0);
    };

    // If Workout is running, create running object
    if (type === 'running') {
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        // Check if data is valid
        //console.log(validInput(distance, duration, cadence));
        alert('The value must be a number');
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If workout is cycling, create cycling objects
    if (type === 'cycling') {
      // Check if data is valid
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        console.log(!validInput(distance, duration, elevation));
        //alert('The value must be a number');
      }

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form and clear the input fields
    this._hideForm();

    // set local storage to all workout
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // popUp properties
    this.#popUpProp = {
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    };

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(L.popup(workout.coords, this.#popUpProp))
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value running-distance">${
              workout.distance
            }</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value running-duration">${
              workout.duration
            }</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value running-pace">${workout.pace.toFixed(
              1
            )}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value running-cadence">${
              workout.cadence
            }</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputElevation.value =
      inputDuration.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    //form.style.display='grid';
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;
    console.log(workoutEl);

    const idEl = workoutEl.getAttribute('data-id');
    console.log(idEl);

    // for(let i=0;i<this.#workouts.length;i++){
    //   if (this.#workouts[i].id===idEl){
    //     console.log(this.#workouts[i].coords);
    //   }
    // }
    const workout=this.#workouts.find(work=> work.id===idEl);
    console.log(workout);

    this.#map.setView(workout.coords,this.#mapZoomLevel,{
      animate: true,
      pan:{
        duration: 1
      }
    });

    // We can interact with the objects using the public interface
    //workout._click();
  }

  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.#workouts));
  }

  _getLocalStorage(){
    const data=JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    this.#workouts=data;
  // Rendering the saved data... 
    this.#workouts.forEach(work=>{
      this._renderWorkout(work);
    })
  }
}

const app = new App();
