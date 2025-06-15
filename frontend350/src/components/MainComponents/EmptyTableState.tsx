const EmptyTableState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 pt-[5vh] lg:pt-[1vh]">
      <div className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
        No Table Selected
      </h3>
      <p className="text-gray-400 dark:text-gray-500 max-w-md">
        Select a table from the sidebar or create a new one to view its contents
      </p>
    </div>
  );
};

export default EmptyTableState;
