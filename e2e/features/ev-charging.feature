Feature: EV charging
  "Milloin ladataan auto?" answers with the cheapest 4-hour charging window
  that starts by 04:00 the next morning, so the car is charged at 08:00. The
  cheapest window in all published prices is compared with it when it is
  cheaper, and the chart shows every published hour: the answer in green, the
  cheaper window in white.

  Scenario: The answer starts by 04:00 the next morning
    Given I open "/ladataan-auto"
    Then the EV charging answer starts by 04:00 the next morning

  Scenario: A cheaper published window is compared and marked on the chart
    Given I open "/ladataan-auto"
    Then a cheaper published window, if there is one, is compared at the bottom and marked in white

  Scenario: The chart shows every published hour
    Given I open "/ladataan-auto"
    Then the chart "ev-chart" has a bar for every hour until the last published price
