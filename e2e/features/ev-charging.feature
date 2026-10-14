Feature: EV charging
  "Milloin ladataan auto?" answers with the cheapest 4-hour charging window
  that starts by 04:00 the next morning, so the car is charged at 08:00. The
  cheapest window in all published prices has a box of its own, and the chart
  shows every published hour.

  Scenario: The answer starts by 04:00 the next morning
    Given I open "/ladataan-auto"
    Then the EV charging answer starts by 04:00 the next morning

  Scenario: The info boxes show the cheapest published window
    Given I open "/ladataan-auto"
    Then the box "ev-best-available" shows a time window

  Scenario: The chart shows every published hour
    Given I open "/ladataan-auto"
    Then the chart "ev-chart" has a bar for every hour until the last published price
