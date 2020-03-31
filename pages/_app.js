import App from "next/app";
import React from "react";
import { createIntl, createIntlCache, RawIntlProvider } from "react-intl";

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache();

export default class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    // Get the `locale` and `messages` from the request object on the server.
    // In the browser, use the same values that the server serialized.
    const { req } = ctx;
    const { locale, messages } = req || window.__NEXT_DATA__.props;

    return { pageProps, locale, messages };
  }

  // Вопрос: нормально ли хранить переводы в стейте?
  state = {
    locale: this.props.locale,
    messages: this.props.messages
  };

  async changeLocale(locale) {
    // Загрузить локаль с сервера если нет данных для языка с стейте
    if (!this.state.messages[locale]) {
      const data = await fetch(`/locales/${locale}`);
      const json = await data.json();
      return this.setState({
        locale,
        messages: {
          ...this.state.messages,
          [locale]: json
        }
      });
    }
    this.setState({ locale });
  }

  render() {
    const { Component, pageProps } = this.props;

    const intl = createIntl(
      {
        locale: this.state.locale,
        messages: this.state.messages[this.state.locale]
      },
      cache
    );

    return (
      <RawIntlProvider value={intl}>
        <button onClick={() => this.changeLocale("ru")}>Set RU Lang</button>
        <button onClick={() => this.changeLocale("en")}>Set EN Lang</button>
        <button onClick={() => this.changeLocale("fr")}>Set FR Lang</button>

        <Component {...pageProps} />
      </RawIntlProvider>
    );
  }
}
