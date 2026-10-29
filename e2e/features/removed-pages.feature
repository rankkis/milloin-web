Feature: Removed pages
  "Milloin Ence pelaa?" and its category Sekalaista were removed when ENCE
  went bankrupt. Home no longer lists them, and their addresses open home.

  Scenario: Home lists no Ence question or Sekalaista category
    Given I open "/"
    Then the categories are "Sähkö, Raha"
    And the questions are "Milloin sähkö on halpaa?, Milloin saunotaan?, Milloin pestään pyykit?, Milloin ladataan auto?, Milloin Kelan tuet maksetaan?, Milloin veronpalautukset tulevat?, Milloin eläke maksetaan?"

  Scenario Outline: <old> opens home
    Given I open "<old>"
    Then I am on "/"
    And the heading is "Milloin…"

    Examples:
      | old               |
      | /ence-pelaa       |
      | /mitakin-tapahtuu |

  Scenario Outline: The server redirects <old> to home, not permanently
    When I request "<old>" without following redirects
    Then it redirects to "/" temporarily

    Examples:
      | old               |
      | /ence-pelaa       |
      | /mitakin-tapahtuu |
