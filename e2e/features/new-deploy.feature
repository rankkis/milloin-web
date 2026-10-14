Feature: Moving around the site across a deploy
  A deploy removes the previous build's code chunks. A visitor who loaded the
  site before it still opens its pages: every page's code is loaded once the
  first page is shown, and a page whose code is gone anyway is loaded again
  from the server instead of failing with "error loading dynamically imported
  module".

  Scenario: Pages open after a deploy without loading the site again
    Given I open "/" and every page's code has loaded
    And a new build is deployed
    When I follow "home-sauna"
    Then I am on "/saunotaan"
    And the heading is "Milloin saunotaan?"
    And the site was not loaded again

  Scenario: A page whose code is gone is loaded again from the server
    Given a deploy removed the code of "app-sauna" before it was loaded
    And I open "/" and every page's code has loaded
    When I follow "home-sauna"
    Then I am on "/saunotaan"
    And the heading is "Milloin saunotaan?"
    And the site was loaded again from the server
