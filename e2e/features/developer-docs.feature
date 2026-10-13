Feature: Developer docs
  Other developers learn the public API at milloin.xyz/docs, in English. The
  visitor first chooses a category of the API; each category has its own
  guides, examples and a reference drawn from the OpenAPI document.

  Scenario Outline: The server renders each docs page
    When the server renders "<path>"
    Then the page answers 200 with the heading "<heading>"

    Examples:
      | path                             | heading                     |
      | /docs                            | milloin.xyz API             |
      | /docs/electricity                | Electricity                 |
      | /docs/electricity/home-assistant | Home Assistant              |
      | /docs/electricity/presets        | Presets                     |
      | /docs/electricity/custom-plans   | Custom plans                |
      | /docs/electricity/reference      | Electricity API reference   |
      | /docs/misc                       | Miscellaneous               |
      | /docs/misc/reference             | Miscellaneous API reference |

  Scenario: The home page footer opens the docs
    Given I open "/"
    When I follow "home-api"
    Then I am on "/docs"
    And the heading is "milloin.xyz API"

  Scenario Outline: The docs home leads to a category
    Given I open "/docs"
    When I follow "docs-choose-<category>"
    Then I am on "/docs/<category>"
    And the heading is "<heading>"

    Examples:
      | category    | heading       |
      | electricity | Electricity   |
      | misc        | Miscellaneous |

  Scenario: The category menu switches categories
    Given I open "/docs/electricity"
    When I follow "docs-category-misc"
    Then I am on "/docs/misc"
    And a code sample contains "/v1/misc/ence"

  Scenario: The electricity menu opens the Home Assistant guide
    Given I open "/docs/electricity"
    When I follow "docs-nav-electricity-home-assistant"
    Then the heading is "Home Assistant"
    And a code sample contains "value_json.current.price"

  Scenario: Each category's API reference lists its own endpoints
    Given I open "/docs/electricity/reference"
    Then the heading is "Electricity API reference"
    And the API reference lists "/v1/electricity/prices/current"
    And the API reference does not list "/v1/misc/ence"
    When I follow "docs-category-misc"
    And I follow "docs-nav-misc-reference"
    Then the heading is "Miscellaneous API reference"
    And the API reference lists "/v1/misc/ence"
    And the API reference does not list "/v1/electricity/prices"

  Scenario Outline: Earlier docs pages open their new page
    Given I open "<old>"
    Then I am on "<new>"

    Examples:
      | old                  | new                              |
      | /docs/home-assistant | /docs/electricity/home-assistant |
      | /docs/reference      | /docs                            |

  @vercel
  Scenario: milloin.xyz/api opens the docs
    When I request "/api" without following redirects
    Then it redirects to "/docs"
