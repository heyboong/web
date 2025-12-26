export function PageHeader({ 
  title, 
  description, 
  icon: Icon,
  actions,
  breadcrumbs,
  stats
}) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Modern Header with Gradient Background */}
      <div className="admin-page-header">
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="stats-card-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                <Icon className="h-8 w-8 text-white relative z-10" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
                {title}
              </h1>
              {description && (
                <p className="text-white/90 text-sm max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 animate-slide-in-right">
              {actions}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {stats && stats.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass-card rounded-xl p-4 hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                  {stat.icon && (
                    <stat.icon className="h-8 w-8 text-white/60" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
