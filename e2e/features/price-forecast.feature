Feature: Price forecast on the price page
  After the last published spot price, the price page's chart and hourly
  tables go on with milloin.xyz's own forecast. Forecast hours are striped in
  the chart and grey in the tables, where each day's estimates open with a
  button. A note says who made them and whom to contact for a longer forecast.
  Without the forecast the page shows the published prices only.

  Scenario: Estimated hours follow the published prices, marked as estimates
    Given milloin.xyz's forecast reaches 24 hours past the published prices
    And I open "/sahko-on-halpaa"
    Then the chart ends with 24 striped estimate bars
    And the hourly price tables hide the estimated hours behind "Näytä arviot"
    And the forecast note says the estimates are made by milloin.xyz and links an email for a longer forecast

  Scenario: The visitor opens and closes the estimated hours in the tables
    Given milloin.xyz's forecast reaches 24 hours past the published prices
    And I open "/sahko-on-halpaa"
    When I open the estimated hours in the tables
    Then the hourly price tables list 24 estimated hours in grey, without a tag on each row
    When I close the estimated hours in the tables
    Then the hourly price tables hide the estimated hours behind "Näytä arviot"

  Scenario: The page shows the published prices when the forecast is unavailable
    Given milloin.xyz's forecast is unavailable
    And I open "/sahko-on-halpaa"
    Then the page shows the price now and the price chart
    And the page shows no estimates
