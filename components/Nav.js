import { FormattedMessage } from 'react-intl'
import Link from 'next/link'

export default () => (
  <nav>
    <li>
      <Link href="/">
        <a>
          <FormattedMessage id="main.nav.home" defaultMessage="Home" />
        </a>
      </Link>
    </li>
    <li>
      <Link href="/about">
        <a>
          <FormattedMessage id="main.nav.about" defaultMessage="About" />
        </a>
      </Link>
    </li>

    <style jsx>{`
      nav {
        display: flex;
      }
      li {
        list-style: none;
        margin-right: 1rem;
      }
    `}</style>
  </nav>
)
