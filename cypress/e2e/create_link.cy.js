import awsconfig from "../../aws-config.dev";
import {
  expectErrorMessageMatching,
  expectExistingLinkItem,
  expectLinkCountEqualsTo,
  expectSuccessMessageContainingLink,
} from "../support/utils";

const apiUrl = awsconfig.API.endpoints[0].endpoint;

describe("Create link", () => {
  beforeEach(() => {
    cy.fetchBaseUrl();
  });

  context("as an anonymous user", () => {
    it("displays a success message containing the created link when given a valid URL", function () {
      cy.intercept("POST", `${apiUrl}/public/links`).as("apiCall");
      cy.visit("/");
      cy.getByTestId("url").type("https://www.google.com");

      cy.contains("Shorten link").click();

      cy.wait("@apiCall").then(({ response }) => {
        const expectedBackhalf = response.body.backhalf;
        expectSuccessMessageContainingLink(this.baseUrl, expectedBackhalf);
      });
    });

    it("does not allow to enter a custom backhalf", function () {
      cy.visit("/");

      cy.contains("Customize").click();

      cy.getByTestId("backhalf").should("not.be.visible");
    });
  });

  context("as a logged in user", () => {
    beforeEach(() => {
      cy.signIn();
      cy.removeAllLinksOwnedByUser();
      cy.visit("/");
    });

    it("displays a success message containing the created link when given a valid URL", function () {
      cy.intercept("POST", `${apiUrl}/links`).as("apiCall");
      const expectedOrigin = "https://www.google.com";
      cy.getByTestId("url").type(expectedOrigin);

      cy.contains("Shorten link").click();

      cy.wait("@apiCall").then(({ response }) => {
        const expectedBackhalf = response.body.backhalf;
        expectSuccessMessageContainingLink(this.baseUrl, expectedBackhalf);
        expectExistingLinkItem(this.baseUrl, expectedBackhalf, expectedOrigin);
      });
      expectLinkCountEqualsTo(1);
    });

    it("displays a success message containing the created link when given a valid URL and a valid backhalf", function () {
      cy.intercept("POST", `${apiUrl}/links`).as("apiCall");
      const expectedBackhalf = "1Guv8mtq3I8uP5FXz6eJ";
      const expectedOrigin = "https://www.google.com";
      cy.getByTestId("url").type(expectedOrigin);
      cy.contains("button", "Customize").click();
      cy.getByTestId("backhalf").type(expectedBackhalf);

      cy.contains("Shorten link").click();

      cy.wait("@apiCall");
      expectSuccessMessageContainingLink(this.baseUrl, expectedBackhalf);
      expectExistingLinkItem(this.baseUrl, expectedBackhalf, expectedOrigin);
      expectLinkCountEqualsTo(1);
    });

    it("displays an error message when given an invalid backhalf", () => {
      cy.intercept("POST", `${apiUrl}/links`).as("apiCall");
      cy.getByTestId("url").type("https://www.google.com");
      cy.contains("button", "Customize").click();
      cy.getByTestId("backhalf").type("no spaces allowed");

      cy.contains("Shorten link").click();

      cy.wait("@apiCall");
      expectErrorMessageMatching(/does not match regex/i);
    });
  });
});
