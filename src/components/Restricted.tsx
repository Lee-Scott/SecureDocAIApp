import React, { useEffect } from 'react';
import { userAPI } from '../service/UserService';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { IResponse } from '../models/IResponse';

const Restricted = () => {
    const { data: userData, error, isLoading } = userAPI.useFetchUserQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });

    if (isLoading || !userData) {
        return (
            <div className="container py-5" style={{ marginTop: '100px' }}>
                <div className="row">
                    <div className="col text-center">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error and navigation options if there is an error
    if (error) {
        const isLoggedIn = !!userData?.data?.user;
        return (
            <div className="container py-5" style={{ marginTop: '100px' }}>
                <div className="row">
                    <div className="col text-center">
                        <div className="alert alert-dismissible alert-danger">
                            {'data' in error
                                ? (error.data as IResponse<void>).message
                                : 'An error occurred'}
                        </div>
                        <div className="mt-4">
                            <Link to="/" className="btn btn-primary mx-2">Go to Home</Link>
                            {isLoggedIn && (
                                <Link to="/profile" className="btn btn-secondary mx-2">Go to Profile</Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (userData.data.user.role === 'ADMIN' || userData.data.user.role === 'SUPER_ADMIN') {
        return <Outlet />;
    } else {
        return (
            <div className="container py-5" style={{ marginTop: '100px' }}>
                <div className="row">
                    <div className="col-md-2 text-center">
                        <p>
                            <i className="bi bi-exclamation-octagon text-warning" style={{ fontSize: '50px' }}></i><br />
                            Status Code: 403
                        </p>
                    </div>
                    <div className="col-md-10">
                        <h3>ACCESS DENIED</h3>
                        <p>Access to this page is denied due to lack of permissions.</p>
                        <Link to={'/'} className="btn btn-primary">Go Back To Home</Link>
                    </div>
                </div>
            </div>
        );
    }
};

export default Restricted;