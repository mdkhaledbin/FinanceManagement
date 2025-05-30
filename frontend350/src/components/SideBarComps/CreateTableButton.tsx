import React, { useState } from "react";
import CreateTableModal from "./CreateTableModal";

const CreateTableButton: React.FC = () => {
  const [showTableCreateModal, setShowTableCreateModal] = useState<boolean>(false);

  const handleCloseModal = () => {
    console.log(`Modal Closed`);
    setShowTableCreateModal(!showTableCreateModal)
  };

  return (
    <>
      <button onClick={handleCloseModal}>
        Create Table
      </button>

      {showTableCreateModal && (
        <CreateTableModal onCloseModal={handleCloseModal} />
      )}
    </>
  );
};

export default CreateTableButton;
