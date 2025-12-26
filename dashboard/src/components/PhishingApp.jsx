import { createRoot } from 'react-dom/client';
import PhishingViewer from './PhishingViewer.jsx';
import LoginViewer from './LoginViewer.jsx';

// Main App component that handles routing between phishing and login views
const PhishingApp = ({ initialData }) => {
  const { website, templateContent, loginTemplateContent, pageType } = initialData;

  if (pageType === 'login') {
    return (
      <LoginViewer 
        website={website}
        loginTemplateContent={loginTemplateContent}
      />
    );
  }

  return (
    <PhishingViewer 
      website={website}
      templateContent={templateContent}
    />
  );
};

// Function to initialize React app
window.initPhishingReactApp = (containerId, data) => {
  const container = document.getElementById(containerId);
  if (container) {
    const root = createRoot(container);
    root.render(<PhishingApp initialData={data} />);
  }
};

export default PhishingApp;
