/*
 * Based on OpenIZ, Copyright (C) 2015 - 2019 Mohawk College of Applied Arts and Technology
 * Copyright (C) 2019 - 2020, Fyfe Software Inc. and the SanteSuite Contributors (See NOTICE.md)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: fyfej
 * Date: 2019-11-27
 */

 /** 
  * @fileoverview Illustrates a controller which is attached to a shared widget. 
  * @see https://help.santesuite.org/santedb/extending-santedb/applets/assets/html-widgets
  * @summary This widget controller is common and shared between widgets in the sample.
  */
 
  /// <reference path="../../.ref/js/SanteDB.js" />
angular.module("santedb").controller("ElboniaCommonWidgetController", ["$scope", "$rootScope", "$interval", function ($scope, $rootScope, $interval) {

    // Recent patients query
    $scope.recentPatientQuery = {
        "creationTime": `>${moment(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)).format('YYYY-MM-DD')}`,
        "_orderBy": "creationTime:desc"
    }

    $scope.openMrsConfig = {
        targetAddress: "0.0.0.0",
        targetPort: 8080,
        dcgEndpoint: window.location.hostname,
        uname: null,
        pwd: null
    }

    /**
     * Resets the OpenMRS user
     */
    async function resetOpenMrsUser() {
        // Does the device already exist?
        var newPass = SanteDB.application.generatePassword();
        var deviceName = `HL7_${$rootScope.system.config.security.deviceName}|LOCAL`;
        var existing = await SanteDB.resources.securityDevice.findAsync({ name: deviceName, _count: 1 });
        if (existing.size == 1) {
            existing = existing.resource[0];
            existing.entity.deviceSecret = newPass;
            var patch = new Patch({
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "deviceSecret",
                        value: newPass
                    })
                ]
            });
            await SanteDB.resources.securityDevice.patchAsync(existing.entity.id, null, patch);
        }
        else {
            existing = await SanteDB.resources.securityDevice.insertAsync(new SecurityDevice({
                name: deviceName,
                deviceSecret: newPass
            }));
            // Hack: The DCG does not apply the proper password
            existing = await resetOpenMrsUser();
            // Now assign the clinical data policy (since default SanteDB does not assign this policy to DEVICE)
            existing.deviceSecret = newPass;
        }

        var policy = await SanteDB.resources.securityPolicy.getAsync('f6840336-4e20-4bc0-b965-baa6d7c80be3');
        policy.$type = 'SecurityPolicyInfo';
        policy.grant = "Grant";
        await SanteDB.resources.securityDevice.addAssociatedAsync(existing.entity.id, "policy", policy);
        return existing;
    }

    // Auto configure
    $scope.autoConfigOpenMRS = async function(form) {

        if(!form.$valid) return;

        if (confirm(SanteDB.locale.getString("mm.openMRS.autoConfigure.confirm"))) {
            try {
                SanteDB.display.buttonWait("#btnAutoConfigure", true);

                // Reset the password
                var existing = await resetOpenMrsUser();
                $scope.device = existing.entity;

                // Now publish
                var request = {
                    "target": `openmrs://${$scope.openMrsConfig.targetAddress}:${$scope.openMrsConfig.targetPort}`,
                    "user": $scope.openMrsConfig.uname,
                    "password": $scope.openMrsConfig.pwd,
                    "parms": {
                        "pdqEp": $scope.openMrsConfig.dcgEndpoint,
                        "pixEp": $scope.openMrsConfig.dcgEndpoint,
                        "arEp": $scope.openMrsConfig.dcgEndpoint,
                        "pdqPort": 12100,
                        "pdqPort": 12100,
                        "arPort": 11514,
                        "arTransport": "audit-udp",
                        "mode": "hl7",
                        "facility": "LOCAL",
                        "device": `HL7_${$rootScope.system.config.security.deviceName}`,
                        "secret": existing.entity.deviceSecret
                    }
                };

                $scope.openMrsConfig.pushed = await SanteDB.api.app.postAsync({
                    data: request,
                    contentType: "application/json",
                    resource: "PushConfig"
                });

                $scope.openMrsConfig.pushed = $scope.openMrsConfig.pushed.map(o=>o.replace("openmrs:", "http:") + "openmrs");
                delete($scope.openMrsConfig.pwd);
                delete($scope.openMrsConfig.uname);
                $("#autoConfigOpenMRS").modal('hide');
                $scope.$apply();
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait("#btnAutoConfigure", false);
            }
        }

    }

    // Regenerate the OpenMRS secret
    $scope.regenerateOpenMRSSecret = async function () {
        if (confirm(SanteDB.locale.getString("elb.mpi.widgets.dashboard.confirm"))) {

            try {
                SanteDB.display.buttonWait("#btnResetOpenMRS", true);
                var existing = await resetOpenMrsUser();
                $scope.device = existing.entity;
                $scope.$apply();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                SanteDB.display.buttonWait("#btnResetOpenMRS", false);
            }
        }
    }

    var timerFunction = async function () {
        try {
            $scope.queues = (await SanteDB.resources.queue.findAsync());
            $scope.$apply();
        }
        catch (e) {
            console.error(e);
        }
    };

    // Interval queue
    timerFunction();
    if (!window.elboniaWidgetIntervalPromise)
        window.elboniaWidgetIntervalPromise = $interval(timerFunction, 10000);

    // Destroy the check queue
    $scope.$on('$destroy', function () {
        if (window.elboniaWidgetIntervalPromise)
            $interval.cancel(window.elboniaWidgetIntervalPromise);
    });

    // Render demographic information
    $scope.renderDemographics = function (patient) {

        var retVal = "";
        if (patient.name) {
            var key = Object.keys(patient.name)[0];
            retVal += `<strong>${SanteDB.display.renderEntityName(patient.name[key])}</strong>`;
        }

        if (patient.identifier) {
            retVal += "<span class='badge badge-secondary'>";
            if (patient.identifier.MOH_GEN_NHID)
                retVal += `<i class="fas fa-id-card"></i> ${SanteDB.display.renderIdentifier(patient.identifier, 'MOH_GEN_NHID')}`;
            else {
                var key = Object.keys(patient.identifier)[0];
                retVal += `<i class="far fa-id-card"></i> ${SanteDB.display.renderIdentifier(patient.identifier, key)}`;
            }
            retVal += `</span><br/>`;
        }
        retVal += `<i class='fas fa-birthday-cake'></i> ${SanteDB.display.renderDate(patient.dateOfBirth, patient.dateOfBirthPrecision)} `;

        // Deceased?
        if (retVal.deceasedDate)
            retVal += `<span class='badge badge-dark'>${SanteDB.locale.getString("ui.model.patient.deceased")}</span>`;

        // Gender
        switch (patient.genderConceptModel.mnemonic) {
            case 'Male':
                retVal += `<i class='fas fa-male' title="${SanteDB.display.renderConcept(patient.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(patient.genderConceptModel)}`;
                break;
            case 'Female':
                retVal += `<i class='fas fa-female' title="${SanteDB.display.renderConcept(patient.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(patient.genderConceptModel)}`;
                break;
            default:
                retVal += `<i class='fas fa-restroom' title="${SanteDB.display.renderConcept(patient.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(patient.genderConceptModel)}`;
                break;
        }
        if (patient.address) {

        }

        return retVal;
    }

    // Retry queue
    $scope.retryAll = async function () {
        try {
            SanteDB.display.buttonWait("#btnRetry", true);
            await SanteDB.resources.queue.insertAsync({ $type: "Queue" });
            await timerFunction();
            SanteDB.display.buttonWait("#btnRetry", false);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Synchronize all now
    $scope.syncNow = async function () {
        try {
            SanteDB.display.buttonWait("#btnSync", true);
            await SanteDB.resources.sync.insertAsync({ $type: "Sync" });
            await timerFunction();
            SanteDB.display.buttonWait("#btnSync", false);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }
}]);
