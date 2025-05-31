import React, { useState } from "react";
import CreateTableModal from "./CreateTableModal";

const CreateTableButton: React.FC = () => {
  const [showTableCreateModal, setShowTableCreateModal] = useState<boolean>(false);

  const handleToggleModal = () => {
    console.log(`Modal Closed`);
    setShowTableCreateModal(!showTableCreateModal)
  };

  return (
    <>
      <button onClick={handleToggleModal}>
        Create Table
      </button>

      {showTableCreateModal && (
        <CreateTableModal onCloseModal={handleToggleModal} />
      )}
    </>
  );
};

export default CreateTableButton;
