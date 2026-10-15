Feature: Sähkö category and price pages
  The Sähkö category page lists the electricity questions with their answers,
  like the other category pages. The price now, the hourly prices and the
  averages are on their own page, /sahko-on-halpaa ("Milloin sähkö on halpaa?").

  Scenario: The Sähkö category page lists the electricity questions
    Given I open "/sahkoa-kannattaa-kayttaa"
    Then the heading is "Sähkö"
    And the questions are "Milloin sähkö on halpaa?, Milloin saunotaan?, Milloin pestään pyykit?, Milloin ladataan auto?"
    And every question has an answer
    And the page has no price chart

  Scenario: The price question opens the price page
    Given I open "/sahkoa-kannattaa-kayttaa"
    When I follow "electricity-category-price"
    Then I am on "/sahko-on-halpaa"
    And the heading is "Sähkön hinta nyt"
    And the page shows the price now and the price chart

  Scenario: Takaisin on the price page returns to the Sähkö category page
    Given I open "/sahkoa-kannattaa-kayttaa"
    When I follow "electricity-category-price"
    And I follow "electricity-back"
    Then I am on "/sahkoa-kannattaa-kayttaa"

  Scenario: Home's Sähkö heading opens the category page
    Given I open "/"
    When I follow "home-category-sahko"
    Then I am on "/sahkoa-kannattaa-kayttaa"
    And the heading is "Sähkö"

  Scenario: Home's spot price opens the price page
    Given I open "/"
    When I follow "home-electricity-price"
    Then I am on "/sahko-on-halpaa"
    And the page shows the price now and the price chart

  Scenario Outline: The server renders <path>
    When the server renders "<path>"
    Then the page answers 200 with the heading "<heading>"

    Examples:
      | path                      | heading          |
      | /sahkoa-kannattaa-kayttaa | Sähkö            |
      | /sahko-on-halpaa          | Sähkön hinta nyt |
