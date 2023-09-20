import { DateTime } from "luxon";
import * as KosherZmanim from "kosher-zmanim";

const weekOf = (week) =>
  `${week[0].toFormat("MMM d")} - ${week.at(-1).toFormat("MMM d")}`;

// 26 minutes before netz
const calculateVasikin = (sunrise) => {
  const sunriseTime = DateTime.fromISO(sunrise);
  const vasikin = sunriseTime.minus({ minute: 26 });

  return vasikin.plus({ second: 30 }).startOf("minute").toFormat("h:mma");
};

// at least 15 minutes before shkiah rounded to nearest 5 minutes
const calculateMinchaMaariv = (sunset) => {
  const sunsetTime = DateTime.fromISO(sunset);
  const minTime = sunsetTime.minus({ minutes: 15 });
  const minutesRounded = Math.floor(minTime.minute / 5) * 5;
  const roundedTime = minTime.set({ minute: minutesRounded });

  return roundedTime.toFormat("h:mma");
};

// 45 minutes before shkiah
const calculateShabbosMincha = (sunset) => {
  const sunsetTime = DateTime.fromISO(sunset);
  const minTime = sunsetTime.minus({ minutes: 45 });
  const minutesRounded = Math.floor(minTime.minute / 5) * 5;
  const roundedTime = minTime.set({ minute: minutesRounded });

  return roundedTime.toFormat("h:mma");
};

// 45/72 minutes after shkiah
const calculateZmanMelacha = (sunset) => {
  const sunsetTime = DateTime.fromISO(sunset);
  const fortySix = sunsetTime.plus({ minutes: 46 });
  const rabeinuTam = fortySix.plus({ minutes: 27 });

  return `${fortySix.toFormat("h:mma")} / ${rabeinuTam.toFormat("h:mma")}`;
};

// Candle lighting is 18 minutes before shkiah and mincha is 3 minutes later
const calculateCandleLighting = (shkia) => {
  const shkiaDT = DateTime.fromISO(shkia);
  const candleLigtingDT = shkiaDT.minus({ minutes: 18 });
  const minchaDT = candleLigtingDT.plus({ minutes: 3 });
  const candleLigtingTime = candleLigtingDT.startOf("minute").toFormat("h:mma");
  const minchaTime = minchaDT.startOf("minute").toFormat("h:mma");

  return `${candleLigtingTime} / ${minchaTime}`;
};

// if you are REALLY into zmanim, of COURSE you use "elevation", but the rest of us...
// stick with just lat/long
const options = {
  //   elevation: 33,
  timeZoneId: "America/New_York",
  latitude: Number.parseFloat("39.35833"),
  longitude: Number.parseFloat("-76.683611"),
  complexZmanim: false,
};

const startDate = DateTime.fromISO("2022-10-19");
const endDate = startDate.plus({ months: 6 });

const dateArray = [];

let currentDate = startDate;
let weekArray = [];
let wednesday, erevShabbos, shabbosKodesh;

while (currentDate <= endDate) {
  if (currentDate.weekday === 7) {
    weekArray = [];
  } else if (currentDate.weekday === 5) {
    erevShabbos = currentDate;
  } else if (currentDate.weekday === 3) {
    wednesday = currentDate;
  }

  weekArray.push(currentDate);

  if (currentDate.weekday === 6) {
    shabbosKodesh = currentDate;
    dateArray.push({
      weekOf: weekOf(weekArray),
      weekArray,
      wednesday,
      erevShabbos,
      shabbosKodesh,
    });
  }

  currentDate = currentDate.plus({ days: 1 });
}

const processWeek = (week) => {
  const { wednesday, erevShabbos, shabbosKodesh, weekOf } = week;
  const wednesdayZmanim = KosherZmanim.getZmanimJson({
    ...options,
    date: wednesday,
  });
  const erevShabbosZmanim = KosherZmanim.getZmanimJson({
    ...options,
    date: erevShabbos,
  });
  const shabbosZmanim = KosherZmanim.getZmanimJson({
    ...options,
    date: shabbosKodesh,
  });

  const {
    BasicZmanim: { Sunset: erevShabbosShkia },
  } = erevShabbosZmanim;

  const {
    BasicZmanim: { Sunset: shabbosShkia },
  } = shabbosZmanim;

  const candleLigtingTime = calculateCandleLighting(erevShabbosShkia);

  const {
    BasicZmanim: { Sunrise: sunrise, Sunset: sunset },
  } = wednesdayZmanim;

  const vasikin = calculateVasikin(sunrise);
  const minchaMaariv = calculateMinchaMaariv(sunset);
  const shabbosMincha = calculateShabbosMincha(shabbosShkia);
  const zmanMelacha = calculateZmanMelacha(shabbosShkia);

  const parsha =
    KosherZmanim.Parsha[
      new KosherZmanim.JewishCalendar(shabbosKodesh).getParsha()
    ];

  console.log(
    `${parsha} - ${weekOf} v: ${vasikin} mm: ${minchaMaariv} c: ${candleLigtingTime} sm: ${shabbosMincha} zm: ${zmanMelacha}`
  );
  console.log("=".repeat(120));
};

dateArray.forEach((week) => processWeek(week));
