import { FormattedRelativeTime, FormattedMessage } from "react-intl";
import { selectUnit } from "@formatjs/intl-utils";
import Layout from "../components/Layout";

export default () => {
  const { value, unit } = selectUnit(Date.now());
  return (
    <Layout>
      <p>
        <FormattedMessage id="about.description" />
        <FormattedRelativeTime
          numeric="auto"
          value={value}
          unit={unit}
          updateIntervalInSeconds={1}
        />
      </p>
    </Layout>
  );
};
