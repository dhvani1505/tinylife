type StatCardProps = {
  title: string
  value: string
  icon: string
}

function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="stat-card">

      <div className="stat-card-top">

        <div className="stat-icon">
          {icon}
        </div>

        <span className="stat-title">
          {title}
        </span>

      </div>

      <p className="stat-value">
        {value}
      </p>

    </div>
  )
}

export default StatCard