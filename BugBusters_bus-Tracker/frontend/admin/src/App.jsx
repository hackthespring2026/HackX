import React from "react";
import Navbar from "./components/NavBar";
import { Route, Routes } from "react-router-dom";

import AddBus from "./components/AddBus";
import ViewBus from "./components/ViewBus";
import EditBus from "./components/EditBus";
import DeleteBus from "./components/DeleteBus";
import AddRoute from "./components/AddRoute";
import ViewRoute from "./components/ViewRoute";
import EditRoute from "./components/EditRoute";
import DeleteRoute from "./components/DeleteRoute";
import AddTrip from "./components/AddTrip";
import ViewTrip from "./components/ViewTrip";
import EditTrip from "./components/EditTrip";
import DeleteTrip from "./components/DeleteTrip";
import Home from "./pages/Home";
import Login from "./components/Login";


function App() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* Dashboard Layout Route */}
        <Route path="/" element={<Home />}>

          {/* CHILD ROUTES (render in Outlet) */}
          <Route path="add-bus" element={<AddBus />} />
          <Route path="view-bus" element={<ViewBus />} />
          <Route path="edit-bus" element={<EditBus />} />
          <Route path="delete-bus" element={<DeleteBus />} />
          <Route path="add-route" element={<AddRoute />} />
          <Route path="view-route" element={<ViewRoute />} />
          <Route path="edit-route" element={<EditRoute />} />
          <Route path="delete-route" element={<DeleteRoute />} />
          <Route path="add-trip" element={<AddTrip />} />
          <Route path="view-trip" element={<ViewTrip />} />
          <Route path="edit-trip" element={<EditTrip />} />
          <Route path="delete-trip" element={<DeleteTrip />} />

        </Route>

        {/* Outside layout */}
        <Route path="/login" element={<Login />} />

      </Routes>
    </>
  );
}

export default App;