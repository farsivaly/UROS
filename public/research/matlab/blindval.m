%% ================================================================
%  BLIND VALIDATION TEST CASES 7-12
%  thermal_IGBT_Loss.slx
%
%  IMPORTANT:
%  - Model/features should now be frozen.
%  - These cases should NOT be used for retraining or feature selection.
%  - One CSV = one independent ML validation sample.
%% ================================================================

clear;
clc;

run("init_pv_inverter.m");

model = 'thermal_IGBT_Loss';

%% Load model
load_system(model);

%% ------------------------------------------------
% Fixed operating/model parameters
%% ------------------------------------------------

Pload = 2000;
m     = 0.8;
f_sw  = 2000;

% Healthy semiconductor parameters
Vf_IGBT  = 0.8;
Ron_IGBT = 1e-3;

% IGBT switching times
tr = 11e-9;
tf = 63e-9;

Ksw = f_sw * (tr + tf);

% Healthy Cauer thermal parameters
Rth1 = 0.05;
Rth2_h = 0.10;
Rth3 = 0.20;

Cth1 = 2;
Cth2 = 10;
Cth3 = 50;

Rinterface_h = 0.02;

%% ------------------------------------------------
% Simulation settings
%% ------------------------------------------------

t_stop   = 60;
n_export = 6002;

time_export = linspace(0, t_stop, n_export).';

set_param(model, 'StopTime', num2str(t_stop));

%% ------------------------------------------------
% Define cases 7-12
%% ------------------------------------------------
%
% Columns:
% [case_number, Ta, Vdc, alpha_deg]

test_cases = [
     7, 27.5, 625, 1.50;   % Moderate
     8, 27.5, 625, 2.00;   % Severe
     9, 32.5, 675, 1.00;   % Healthy
    10, 32.5, 675, 1.25;   % Mild
    11, 32.5, 675, 1.50;   % Moderate
    12, 32.5, 675, 2.00    % Severe
];

%% ------------------------------------------------
% Output directory
%% ------------------------------------------------

output_folder = fullfile('ml', 'data', 'raw', 'test_cases');

if ~exist(output_folder, 'dir')
    mkdir(output_folder);
end

%% ------------------------------------------------
% Manifest
%% ------------------------------------------------

manifest = table();

%% ================================================================
% RUN CASES
%% ================================================================

for k = 1:size(test_cases,1)

    case_num  = test_cases(k,1);
    Ta        = test_cases(k,2);
    Vdc       = test_cases(k,3);
    alpha_deg = test_cases(k,4);

    %% Severity label
    if alpha_deg == 1.00
        severity = 'Healthy';
    elseif alpha_deg == 1.25
        severity = 'Mild';
    elseif alpha_deg == 1.50
        severity = 'Moderate';
    elseif alpha_deg == 2.00
        severity = 'Severe';
    else
        error('Unknown alpha_deg = %.3f', alpha_deg);
    end

    fprintf('\n====================================================\n');
    fprintf('TEST CASE %02d\n', case_num);
    fprintf('Severity  : %s\n', severity);
    fprintf('Ta        : %.1f C\n', Ta);
    fprintf('Vdc       : %.0f V\n', Vdc);
    fprintf('alpha_deg : %.2f\n', alpha_deg);
    fprintf('====================================================\n');

    %% ------------------------------------------------------------
    % Set degradation
    %% ------------------------------------------------------------

    Rth2 = alpha_deg * Rth2_h;

    % Healthy interface for internal thermal-degradation campaign
    Rinterface = Rinterface_h;

    %% ------------------------------------------------------------
    % Put variables into base workspace
    %% ------------------------------------------------------------

    assignin('base', 'Ta', Ta);
    assignin('base', 'Vdc', Vdc);
    assignin('base', 'Pload', Pload);
    assignin('base', 'm', m);
    assignin('base', 'f_sw', f_sw);

    assignin('base', 'Vf_IGBT', Vf_IGBT);
    assignin('base', 'Ron_IGBT', Ron_IGBT);

    assignin('base', 'tr', tr);
    assignin('base', 'tf', tf);
    assignin('base', 'Ksw', Ksw);

    assignin('base', 'Rth1', Rth1);
    assignin('base', 'Rth2', Rth2);
    assignin('base', 'Rth2_h', Rth2_h);
    assignin('base', 'Rth3', Rth3);

    assignin('base', 'Cth1', Cth1);
    assignin('base', 'Cth2', Cth2);
    assignin('base', 'Cth3', Cth3);

    assignin('base', 'Rinterface', Rinterface);
    assignin('base', 'Rinterface_h', Rinterface_h);

    assignin('base', 'alpha_deg', alpha_deg);

    %% ------------------------------------------------------------
    % Run simulation
    %% ------------------------------------------------------------

    try
        simOut = sim(model, ...
            'StopTime', num2str(t_stop), ...
            'ReturnWorkspaceOutputs', 'on');

    catch ME
        fprintf(2, '\nSimulation FAILED for case %02d\n', case_num);
        fprintf(2, '%s\n', ME.message);
        rethrow(ME);
    end

    %% ============================================================
    % GET SURFACE TEMPERATURE
    %% ============================================================

    if isprop(simOut, 'T_surface_inv')
        surface_ts = simOut.T_surface_inv;
    else
        surface_ts = evalin('base', 'T_surface_inv');
    end

    t_surface = double(surface_ts.Time(:));
    T_surface = squeeze(double(surface_ts.Data));
    T_surface = T_surface(:);

    %% ============================================================
    % GET RAMAN DTS
    %% ============================================================

    if isprop(simOut, 'spatial_DTS')
        dts_ts = simOut.spatial_DTS;
    else
        dts_ts = evalin('base', 'spatial_DTS');
    end

    t_dts = double(dts_ts.Time(:));
    raw_dts = double(dts_ts.Data);

    fprintf('Raw spatial_DTS size = %s\n', mat2str(size(raw_dts)));

    % Expected:
    % raw_dts = [2 x 41 x N]
    %
    % Row 1 = DTS temperature
    % Row 2 = auxiliary quantity

    if ndims(raw_dts) == 3 && size(raw_dts,1) >= 1

        T_DTS = squeeze(raw_dts(1,:,:)).';

    elseif ismatrix(raw_dts) && size(raw_dts,2) == 41

        T_DTS = raw_dts;

    elseif ismatrix(raw_dts) && size(raw_dts,1) == 41

        T_DTS = raw_dts.';

    else
        error('Unexpected spatial_DTS dimensions: %s', ...
            mat2str(size(raw_dts)));
    end

    fprintf('Extracted DTS size = %s\n', mat2str(size(T_DTS)));

    %% ------------------------------------------------------------
    % Ensure timestamps/data match
    %% ------------------------------------------------------------

    nDTS = min(length(t_dts), size(T_DTS,1));

    t_dts = t_dts(1:nDTS);
    T_DTS = T_DTS(1:nDTS,:);

    %% ============================================================
    % INTERPOLATE TO EXACTLY 6002 SAMPLES
    %% ============================================================

    T_surface_export = interp1( ...
        t_surface, ...
        T_surface, ...
        time_export, ...
        'linear', ...
        'extrap');

    T_DTS_export = interp1( ...
        t_dts, ...
        T_DTS, ...
        time_export, ...
        'linear', ...
        'extrap');

    %% ============================================================
    % CREATE OUTPUT TABLE
    %% ============================================================

    out = table();

    out.time_s = time_export;

    % Surface temperature
    out.T_surface_K = T_surface_export;
    out.T_surface_C = T_surface_export - 273.15;

    %% DTS channels
    n_channels = size(T_DTS_export,2);

    for ch = 1:n_channels

        nameK = sprintf('DTS_%02d_K', ch);
        nameC = sprintf('DTS_%02d_C', ch);

        out.(nameK) = T_DTS_export(:,ch);
        out.(nameC) = T_DTS_export(:,ch) - 273.15;

    end

    %% ============================================================
    % FILE NAME
    %% ============================================================

    filename = sprintf( ...
        'test_%02d_%s_Ta%.1f_Vdc%.0f_alpha%.2f.csv', ...
        case_num, ...
        severity, ...
        Ta, ...
        Vdc, ...
        alpha_deg);

    filepath = fullfile(output_folder, filename);

    writetable(out, filepath);

    fprintf('Saved: %s\n', filepath);
    fprintf('Rows : %d\n', height(out));

    %% ============================================================
    % MANIFEST ENTRY
    %% ============================================================

    row = table( ...
        case_num, ...
        string(severity), ...
        Ta, ...
        Vdc, ...
        Pload, ...
        m, ...
        alpha_deg, ...
        Rth2, ...
        string(filename), ...
        'VariableNames', { ...
            'test_case', ...
            'severity', ...
            'Ta_C', ...
            'Vdc_V', ...
            'Pload_W', ...
            'modulation_index', ...
            'alpha_deg', ...
            'Rth2_K_per_W', ...
            'source_file'});

    manifest = [manifest; row];

end

%% ================================================================
% SAVE MANIFEST
%% ================================================================

manifest_file = fullfile( ...
    output_folder, ...
    'blind_validation_cases_07_12_manifest.csv');

writetable(manifest, manifest_file);

fprintf('\n====================================================\n');
fprintf('BLIND VALIDATION CASES 7-12 COMPLETE\n');
fprintf('====================================================\n');
fprintf('Cases generated : %d\n', height(manifest));
fprintf('Manifest        : %s\n', manifest_file);
fprintf('\nDO NOT retrain or modify features before scoring these cases.\n');