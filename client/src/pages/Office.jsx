function Office() {
  const username = localStorage.getItem("username");

  return (
    <div>
      <h1>Welcome {username}</h1>
      <h3>Virtual Office</h3>
    </div>
  );
}

export default Office;