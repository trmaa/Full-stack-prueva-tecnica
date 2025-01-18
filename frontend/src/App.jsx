import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import PropTypes from 'prop-types';
import './App.css';

const { VITE_API_HOST: API_HOST } = import.meta.env;

async function upload_file(file) {
  const form_data = new FormData();
  form_data.append('file', file);

  try {
    const res = await fetch(`http://${API_HOST}/api/files`, {
      method: 'POST',
      body: form_data,
    });

    if (!res.ok) {
      return [new Error(`Error uploading file: ${res.message}`)];
    }
    const json = await res.json();

    console.log(json);

    return [null, json];
  } catch (error) {
    if (error instanceof Error) return [error];
  }

  return [new Error('unknown error')];
}

async function search_data(search) {
  try {
    const res = await fetch(`http://${API_HOST}/api/users?q=` + search, {
      method: 'GET',
    });

    if (!res.ok) {
      return [new Error(`Error searching data: ${res.message}`)];
    }
    const json = await res.json();

    console.log(json);

    return [null, json];
  } catch (error) {
    if (error instanceof Error) return [error];
  }

  return [new Error('unknown error')];
}

function Search({ initial_data }) {
  const [data, set_data] = useState(initial_data);
  const [search, set_search] = useState('');

  const handle_search = (event) => {
    set_search(event.target.value);
  };

  useEffect(() => {
    if (!search) {
      set_data(initial_data);
      return;
    }

    search_data(search).then(([err, new_data]) => {
      if (err) {
        toast.error(err.message);
        return;
      }
      set_data(new_data);
    });
  }, [search, initial_data]);

  return (
    <>
      <h3>Search</h3>
      <form>
        <input onChange={handle_search} type="search" placeholder="Search..." />
      </form>
      {
        data.data.map((user) => (
          <div key={user.id} className="tag">
            {
              Object.entries(user).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}</strong>: {value}
                </p>
              ))
            }
          </div>
        ))
      }
    </>
  );
}

Search.propTypes = {
  initial_data: PropTypes.array.isRequired,
};

const APP_STATUS = {
  IDLE: 'idle',
  ERROR: 'error',
  READY_UPLOAD: 'ready_upload',
  UPLOADING: 'uploading',
  READY_USAGE: 'ready_usage',
};

const BUTTON_TEXT = {
  [APP_STATUS.READY_UPLOAD]: 'Upload file',
  [APP_STATUS.UPLOADING]: 'Uploading...',
};

function App() {
  const [app_status, set_app_status] = useState(APP_STATUS.IDLE);
  const [file, set_file] = useState(null);
  const [data, set_data] = useState([]);

  const input_change = (event) => {
    const [file] = event.target.files ?? [];
    set_file(file);
    set_app_status(APP_STATUS.READY_UPLOAD);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (app_status !== APP_STATUS.READY_UPLOAD || !file) {
      return;
    }

    set_app_status(APP_STATUS.UPLOADING);

    const [err, new_data] = await upload_file(file);

    if (err) {
      set_app_status(APP_STATUS.ERROR);
      toast.error(err.message);
      return;
    }

    set_app_status(APP_STATUS.READY_USAGE);
    if (new_data) {
      set_data(new_data);
    }
    toast.success('File uploaded');
  };

  const show_button = app_status === APP_STATUS.READY_UPLOAD || app_status === APP_STATUS.UPLOADING;
  const show_input = app_status !== APP_STATUS.READY_USAGE;

  return (
    <>
      <Toaster />
      <h3>Prueba tecnica: upload CSV + search</h3>
      <form onSubmit={submit}>
        {
          show_input &&
          (
            <label>
              <input
                disabled={app_status === APP_STATUS.UPLOADING}
                onChange={input_change}
                name="file"
                type="file"
                accept=".csv"
              />
            </label>
          )
        }
        {
          show_button &&
          (
            <button disabled={app_status === APP_STATUS.UPLOADING}>
              {BUTTON_TEXT[app_status]}
            </button>
          )
        }
      </form>

      {
        app_status === APP_STATUS.READY_USAGE &&
        (
          <Search initial_data={data} />
        )
      }
    </>
  );
}

export default App;
