Feature: Developer docs
  Other developers learn the public API at milloin.xyz/docs: guides in
  English and a reference drawn from the OpenAPI document.

  Scenario Outline: The server renders each docs page
    When the server renders "<path>"
    Then the page answers 200 with the heading "<heading>"

    Examples:
      | path                 | heading         |
      | /docs                | milloin.xyz API |
      | /docs/home-assistant | Home Assistant  |
      | /docs/presets        | Presets         |
      | /docs/custom-plans   | Custom plans    |
      | /docs/reference      | API reference   |

  Scenario: The home page footer opens the docs
    Given I open "/"
    When I follow "home-api"
    Then I am on "/docs"
    And the heading is "milloin.xyz API"

  Scenario: The docs menu opens the Home Assistant guide
    Given I open "/docs"
    When I follow "docs-nav-home-assistant"
    Then the heading is "Home Assistant"
    And a code sample contains "value_json.current.price"

  Scenario: The API reference lists the endpoints
    Given I open "/docs/reference"
    Then the heading is "API reference"
    And the API reference lists "/v1/electricity/prices/current"
    And the API reference lists "/v1/misc/ence"

  @vercel
  Scenario: milloin.xyz/api opens the docs
    When I request "/api" without following redirects
    Then it redirects to "/docs"
