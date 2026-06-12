const ErrorMessage = ({ message }: { message?: string }) => (
  <div className="flex grow items-center justify-center bg-gray-900 text-white">
    <p>{message ?? "Failed to load content. Please try again later."}</p>
  </div>
);

export default ErrorMessage;
