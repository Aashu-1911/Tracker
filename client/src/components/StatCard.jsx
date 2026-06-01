const StatCard = ({ label, value, meta }) => (
  <div className="card">
    <h3>{label}</h3>
    <p className="stat">{value}</p>
    {meta ? <p className="meta">{meta}</p> : null}
  </div>
);

export default StatCard;
